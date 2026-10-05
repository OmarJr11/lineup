import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerAsyncOptions } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';

export const throttlerAsyncConfig: ThrottlerAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = configService.get<string>('REDIS_PASSWORD', '');

    const redis = new Redis({
      host: redisHost,
      port: Number(redisPort),
      password: redisPassword || undefined,
      maxRetriesPerRequest: 2,
      enableReadyCheck: false,
    });

    const ttlShort = configService.get<number>('THROTTLE_TTL_SHORT', 1000);
    const limitShort = configService.get<number>('THROTTLE_LIMIT_SHORT', 15);

    const ttlMedium = configService.get<number>('THROTTLE_TTL_MEDIUM', 10000);
    const limitMedium = configService.get<number>('THROTTLE_LIMIT_MEDIUM', 60);

    const ttlLong = configService.get<number>('THROTTLE_TTL_LONG', 60000);
    const limitLong = configService.get<number>('THROTTLE_LIMIT_LONG', 300);

    return {
      throttlers: [
        { name: 'short', ttl: Number(ttlShort), limit: Number(limitShort) },
        { name: 'medium', ttl: Number(ttlMedium), limit: Number(limitMedium) },
        { name: 'long', ttl: Number(ttlLong), limit: Number(limitLong) },
      ],
      storage: new ThrottlerStorageRedisService(redis),
    };
  },
};
