import { Module } from '@nestjs/common';
import { ProductsResolver } from './products.resolver';
import { ProductReactionsModule } from '../../../../core/modules/product-reactions/product-reactions.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { TokensModule } from '../../../../core/modules/token/token.module';
import { AuthModule } from '../../../../core/modules/auth/auth.module';

@Module({
  providers: [ProductsResolver],
  exports: [ProductsResolver],
  imports: [ProductReactionsModule, RolesModule, TokensModule, AuthModule],
})
export class ProductsModule {}
