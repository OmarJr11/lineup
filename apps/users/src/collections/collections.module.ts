import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CollectionsResolver } from './collections.resolver';
import { ProductCollectionsModule } from '../../../../core/modules/product-collections/product-collections.module';
import { OptionalJwtAuthGuard } from '../../../../core/common/guards';

/**
 * Collections module for the users app.
 * Exposes product collections query for personalized recommendations.
 */
@Module({
  imports: [
    ProductCollectionsModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  providers: [CollectionsResolver, OptionalJwtAuthGuard],
})
export class CollectionsModule {}
