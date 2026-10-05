import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { entities } from '../../../core/entities/entities';
import { LoggerMiddleware } from '../../../core/common/middlewares/logger-middleware.middleware';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  configuration,
  ValidatingEnv,
  throttlerAsyncConfig,
} from '../../../core/common/config';
import GraphQLJSON from 'graphql-type-json';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { EnvironmentsEnum } from '../../../core/common/enums';
import { GqlThrottlerGuard } from '../../../core/common/guards';
import { ThrottlerModule } from '@nestjs/throttler';
import * as depthLimitLib from 'graphql-depth-limit';
const depthLimit = (depthLimitLib as any).default || depthLimitLib;
import { SocialNetworksModule } from './social-networks/social-networks.module';
import { SeedModule } from './seed/seed.module';
import { RolesAdminModule } from './roles-admin/roles-admin.module';
import { AdminStatisticsModule } from './admin-statistics/admin-statistics.module';
import { BusinessesModule } from './businesses/businesses.module';
import { BullModule } from '@nestjs/bullmq';

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
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      resolvers: { JSON: GraphQLJSON },
      autoSchemaFile: true,
      playground: process.env.NODE_ENV !== EnvironmentsEnum.Production,
      debug: process.env.NODE_ENV !== EnvironmentsEnum.Production,
      sortSchema: true,
      introspection: process.env.NODE_ENV !== EnvironmentsEnum.Production,
      // Include both `req` and `res` in the GraphQL context so resolvers
      // can set cookies on the response (used by AuthService.setCookies).
      context: ({ req, res }) => ({ req, res }),
      installSubscriptionHandlers: false,
      validationRules: [depthLimit(Number(process.env.GQL_DEPTH_LIMIT) || 6)],
      formatError: (error: any) => {
        const message = error?.message || 'Internal server error';
        const extCode = error?.extensions?.code;
        const extResponse = error?.extensions?.response;
        let code = 500;
        if (extResponse && typeof extResponse.statusCode === 'number') {
          code = extResponse.statusCode;
        } else if (extCode) {
          switch (String(extCode)) {
            case 'BAD_REQUEST':
              code = 400;
              break;
            case 'UNAUTHORIZED':
              code = 401;
              break;
            case 'FORBIDDEN':
              code = 403;
              break;
            case 'NOT_FOUND':
              code = 404;
              break;
            case 'TOO_MANY_REQUESTS':
              code = 429;
              break;
            default:
              code = 500;
          }
        }
        const status = code >= 200 && code < 300;
        return { code, status, message };
      },
    }),
    ThrottlerModule.forRootAsync(throttlerAsyncConfig),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),
    UsersModule,
    AuthModule,
    FilesModule,
    SocialNetworksModule,
    SeedModule,
    RolesAdminModule,
    AdminStatisticsModule,
    BusinessesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
  ],
})
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('');
  }
}
