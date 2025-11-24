import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from '../../../core/entities/entities';
import { LoggerMiddleware } from '../../../core/common/middlewares/logger-middleware.middleware';
import { AuthModule } from './auth/auth.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { UsersModule as UsersModuleCore } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration, ValidatingEnv } from '../../../core/common/config';
import { EnvironmentsEnum } from '../../../core/common/enums';

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
      autoSchemaFile: true,
      playground: process.env.NODE_ENV !== EnvironmentsEnum.Production,
      debug: process.env.NODE_ENV !== EnvironmentsEnum.Production,
      sortSchema: true,
      introspection: true,
      context: ({ req, res }) => ({ req, res }),
      installSubscriptionHandlers: true,
    }),
    AuthModule,
    UsersModuleCore,
  ],
})
export class UsersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('');
  }
}