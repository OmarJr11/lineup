import { Module } from '@nestjs/common';
import { ProductsResolver } from './products.resolver';
import { ProductsModule as ProductsModuleCore } from '../../../../core/modules/products/products.module';
import { ProductSkusModule } from '../../../../core/modules/product-skus/product-skus.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { TokensModule } from '../../../../core/modules/token/token.module';
import { ProductSkusResolver } from './product-skus.resolver';

@Module({
  imports: [ProductsModuleCore, ProductSkusModule, RolesModule, TokensModule],
  providers: [ProductsResolver, ProductSkusResolver],
})
export class ProductsModule {}
