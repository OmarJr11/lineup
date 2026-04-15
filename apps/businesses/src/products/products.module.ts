import { Module } from '@nestjs/common';
import { ProductsResolver } from './products.resolver';
import { ProductsModule as ProductsModuleCore } from '../../../../core/modules/products/products.module';
import { ProductSkusModule } from '../../../../core/modules/product-skus/product-skus.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { TokensModule } from '../../../../core/modules/token/token.module';
import { ProductSkusResolver } from './product-skus.resolver';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ProductsModuleCore,
    ProductSkusModule,
    RolesModule,
    TokensModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  providers: [ProductsResolver, ProductSkusResolver],
})
export class ProductsModule {}
