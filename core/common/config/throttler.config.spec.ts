import type { ConfigService } from '@nestjs/config';
import { throttlerAsyncConfig } from './throttler.config';

jest.mock('ioredis', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      quit: jest.fn(),
    })),
  };
});

jest.mock('@nest-lab/throttler-storage-redis', () => ({
  ThrottlerStorageRedisService: jest.fn().mockImplementation(() => ({})),
}));

describe('throttlerAsyncConfig', () => {
  it('should use default values when environment variables are not set', () => {
    const configServiceMock = {
      get: jest
        .fn()
        .mockImplementation(
          (key: string, defaultValue: unknown) => defaultValue,
        ),
    } as unknown as ConfigService;

    const factory = throttlerAsyncConfig.useFactory;
    expect(factory).toBeDefined();

    if (factory) {
      const options = factory(configServiceMock) as {
        throttlers: Array<{ name: string; ttl: number; limit: number }>;
        storage: unknown;
      };

      expect(options.throttlers).toEqual([
        { name: 'short', ttl: 1000, limit: 15 },
        { name: 'medium', ttl: 10000, limit: 60 },
        { name: 'long', ttl: 60000, limit: 300 },
      ]);
      expect(options.storage).toBeDefined();
    }
  });

  it('should use custom values from ConfigService when configured', () => {
    const configMap: Record<string, unknown> = {
      REDIS_HOST: 'cache.example.com',
      REDIS_PORT: 6380,
      REDIS_PASSWORD: 'secretpassword',
      THROTTLE_TTL_SHORT: 2000,
      THROTTLE_LIMIT_SHORT: 30,
      THROTTLE_TTL_MEDIUM: 20000,
      THROTTLE_LIMIT_MEDIUM: 120,
      THROTTLE_TTL_LONG: 120000,
      THROTTLE_LIMIT_LONG: 600,
    };

    const configServiceMock = {
      get: jest
        .fn()
        .mockImplementation((key: string, defaultValue: unknown) => {
          return configMap[key] ?? defaultValue;
        }),
    } as unknown as ConfigService;

    const factory = throttlerAsyncConfig.useFactory;
    if (factory) {
      const options = factory(configServiceMock) as {
        throttlers: Array<{ name: string; ttl: number; limit: number }>;
        storage: unknown;
      };

      expect(options.throttlers).toEqual([
        { name: 'short', ttl: 2000, limit: 30 },
        { name: 'medium', ttl: 20000, limit: 120 },
        { name: 'long', ttl: 120000, limit: 600 },
      ]);
      expect(options.storage).toBeDefined();
    }
  });
});
