import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { GraphQLFormattedError } from 'graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from '../../../core/entities/entities';
import { LoggerMiddleware } from '../../../core/common/middlewares/logger-middleware.middleware';
import { AuthModule } from './auth/auth.module';
import GraphQLJSON from 'graphql-type-json';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { FilesModule } from './files/files.module';
import { BusinessesModule as BusinessesModuleCore } from './businesses/businesses.module';
import { LocationsModule } from './locations/locations.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration, ValidatingEnv } from '../../../core/common/config';
import { EnvironmentsEnum } from '../../../core/common/enums';
import { ProductsModule } from './products/products.module';
import { CatalogsModule } from './catalogs/catalogs.module';
import { SocialNetworksModule } from './social-networks/social-networks.module';
import { SocialNetworkBusinessesModule } from './social-network-businesses/social-network-businesses.module';
import { CurrenciesModule } from './currencies/currencies.module';
import { VerificationCodesModule } from './verification-codes/verification-codes.module';
import { InventoryModule } from './inventory/inventory.module';
import { DiscountsModule } from './discounts/discounts.module';
import { StatisticsModule } from './statistics/statistics.module';
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
      playground:
        process.env.NODE_ENV !== (EnvironmentsEnum.Production as string),
      debug: process.env.NODE_ENV !== (EnvironmentsEnum.Production as string),
      sortSchema: true,
      introspection: true,
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }),
      installSubscriptionHandlers: false,
      formatError: (formattedError: GraphQLFormattedError) => {
        const message = formattedError.message || 'Internal server error';
        const extensions = formattedError.extensions;
        const extCode =
          extensions !== undefined &&
          extensions !== null &&
          typeof extensions === 'object' &&
          'code' in extensions
            ? extensions.code
            : undefined;
        let code = 500;
        const responsePayload =
          extensions !== undefined &&
          extensions !== null &&
          typeof extensions === 'object' &&
          'response' in extensions
            ? extensions.response
            : undefined;
        if (
          responsePayload !== undefined &&
          responsePayload !== null &&
          typeof responsePayload === 'object' &&
          'statusCode' in responsePayload &&
          typeof (responsePayload as { statusCode: unknown }).statusCode ===
            'number'
        ) {
          code = (responsePayload as { statusCode: number }).statusCode;
        } else if (typeof extCode === 'string' || typeof extCode === 'number') {
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
            default:
              code = 500;
          }
        }
        const status = code >= 200 && code < 300;
        return { code, status, message };
      },
      path: '/graphql',
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),
    AuthModule,
    FilesModule,
    BusinessesModuleCore,
    LocationsModule,
    ProductsModule,
    CatalogsModule,
    SocialNetworksModule,
    SocialNetworkBusinessesModule,
    CurrenciesModule,
    VerificationCodesModule,
    InventoryModule,
    DiscountsModule,
    StatisticsModule,
  ],
})
export class BusinessesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('');
  }
}
