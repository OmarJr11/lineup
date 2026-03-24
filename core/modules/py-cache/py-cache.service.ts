import { Injectable, Logger } from '@nestjs/common';
import { createClient } from 'redis';
import { LogError } from '../../common/helpers/logger.helper';

const MIN_IDLE_SECONDS = 15 * 24 * 60 * 60;
const MAX_DELETE_IDLE_ITERATIONS = 1000;

type ConnectedRedisClient = Awaited<
  ReturnType<ReturnType<typeof createClient>['connect']>
>;

/**
 * Redis-backed cache helpers (JSON values, scan by prefix, idle-key cleanup).
 */
@Injectable()
export class PyCacheService {
  private readonly logger = new Logger(PyCacheService.name);

  /**
   * Persists a JSON-serializable object under the key, replacing any existing value.
   *
   * @param {string} key - Redis key
   * @param {object} data - Value to stringify and store
   * @param {number} ttlSeconds - Optional expiration in seconds
   */
  async setCache(key: string, data: object, ttlSeconds?: number) {
    const client = await this.connectClient();
    try {
      await client.del(key);
      const value = JSON.stringify(data);
      if (ttlSeconds !== undefined && ttlSeconds > 0) {
        await client.set(key, value, { EX: ttlSeconds });
      } else {
        await client.set(key, value);
      }
    } finally {
      await client.disconnect();
    }
  }

  /**
   * Reads and parses a JSON object from Redis.
   *
   * @param key - Redis key
   * @returns Parsed object or null when missing
   */
  async getCache(key: string): Promise<object | null> {
    const client = await this.connectClient();
    try {
      const value = await client.get(key);
      if (value === null) {
        return null;
      }
      return JSON.parse(String(value)) as object;
    } finally {
      await client.disconnect();
    }
  }

  /**
   * Removes a single key.
   *
   * @param key - Redis key
   */
  async deleteCache(key: string): Promise<void> {
    const client = await this.connectClient();
    try {
      await client.del(key);
    } finally {
      await client.disconnect();
    }
  }

  /**
   * Deletes all keys whose names start with the given prefix.
   *
   * @param prefix - Key prefix (e.g. `scan:violations:`)
   * @returns Keys that were deleted
   */
  async deleteKeysByPrefix(prefix: string): Promise<string[]> {
    const client = await this.connectClient();
    try {
      const keys: string[] = [];
      const iterator = client.scanIterator({
        MATCH: `${prefix}*`,
        COUNT: 1000,
      });
      for await (const key of iterator) {
        keys.push(String(key));
      }
      if (keys.length > 0) {
        await client.sendCommand(['DEL', ...keys]);
      }
      return keys;
    } finally {
      await client.disconnect();
    }
  }

  /**
   * Lists keys with idle time at least {@link MIN_IDLE_SECONDS}, skipping ad-hoc Bull keys.
   *
   * @returns Keys and their OBJECT IDLETIME in seconds (-1 when unknown)
   */
  async getAllIdleKeys(): Promise<{ key: string; idleSeconds: number }[]> {
    const client = await this.connectClient();
    try {
      const keysWithIdle: { key: string; idleSeconds: number }[] = [];
      const iterator = client.scanIterator({ MATCH: '*', COUNT: 1000 });
      const bullKeyPattern = /^bull:[^:]+:\d+$/;
      for await (const key of iterator) {
        const keyStr = String(key);
        if (keyStr.startsWith('bull:') && !bullKeyPattern.test(keyStr)) {
          continue;
        }
        let idleSeconds: number;
        try {
          idleSeconds = await client.sendCommand<number>([
            'OBJECT',
            'IDLETIME',
            keyStr,
          ]);
        } catch (error) {
          LogError(this.logger, error as Error, this.getAllIdleKeys.name);
          idleSeconds = -1;
        }
        if ((idleSeconds ?? -1) < MIN_IDLE_SECONDS) {
          continue;
        }
        keysWithIdle.push({ key: keyStr, idleSeconds: idleSeconds ?? -1 });
      }
      return keysWithIdle;
    } finally {
      await client.disconnect();
    }
  }

  /**
   * Repeatedly deletes keys returned by {@link getAllIdleKeys} until none remain or max iterations.
   *
   * @returns Count of deleted key entries (sum per batch)
   */
  async deleteIdleKeys(): Promise<number> {
    let deleted = 0;
    let iteration = 0;
    while (iteration < MAX_DELETE_IDLE_ITERATIONS) {
      iteration += 1;
      const keys = await this.getAllIdleKeys();
      if (keys.length === 0) {
        break;
      }
      const client = await this.connectClient();
      try {
        await client.del(keys.map((k) => k.key));
      } finally {
        await client.disconnect();
      }
      deleted += keys.length;
    }
    return deleted;
  }

  /**
   * Builds a connected Redis client using REDIS_URL or REDIS_HOST / REDIS_PORT.
   */
  private async connectClient(): Promise<ConnectedRedisClient> {
    const url = this.resolveRedisUrl();
    const client = createClient({ url });
    return await client.connect();
  }

  /**
   * Resolves the Redis connection URL from environment variables.
   */
  private resolveRedisUrl(): string {
    const fromEnv = process.env.REDIS_URL?.trim();
    if (fromEnv) {
      return fromEnv;
    }
    const host = process.env.REDIS_HOST || 'localhost';
    const port = process.env.REDIS_PORT || '6379';
    return `redis://${host}:${port}`;
  }
}
