import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerMiddleware } from '../../../core/common/middlewares/logger-middleware.middleware';
import { configuration, ValidatingEnv } from '../../../core/common/config';
import { entities } from '../../../core/entities/entities';
import { ConsumersModule } from '../../../core/consumers';
import { CronsModule } from '../../../core/crons';

/**
 * Worker application: BullMQ consumers and scheduled cron jobs.
 * Runs separately from the admin GraphQL API so queue processing is isolated.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: false,
      isGlobal: true,
      load: [configuration],
      validationSchema: ValidatingEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          type: configService.get<'postgres'>('DB_TYPE'),
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          entities: entities,
          synchronize: false,
          logging: false,
        };
      },
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
    }),
    ConsumersModule.register(),
    CronsModule,
  ],
})
export class BackgroundProcessesModule implements NestModule {
  /**
   * Applies global HTTP logging for any routes registered on this app.
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('');
  }
}
