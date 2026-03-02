import { Module } from '@nestjs/common';
import { ProductsResolver } from './products.resolver';
import { ProductRatingsResolver } from './product-ratings.resolver';
import { ProductReactionsModule } from '../../../../core/modules/product-reactions/product-reactions.module';
import { ProductRatingsModule } from '../../../../core/modules/product-ratings/product-ratings.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { TokensModule } from '../../../../core/modules/token/token.module';
import { AuthModule } from '../../../../core/modules/auth/auth.module';

@Module({
    providers: [ProductsResolver, ProductRatingsResolver],
    exports: [ProductsResolver, ProductRatingsResolver],
    imports: [ProductReactionsModule, ProductRatingsModule, RolesModule, TokensModule, AuthModule],
})
export class ProductsModule {}
