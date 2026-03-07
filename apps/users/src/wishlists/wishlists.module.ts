import { Module } from '@nestjs/common';
import { WishlistsResolver } from './wishlists.resolver';
import { BusinessFollowersModule } from '../../../../core/modules/business-followers/business-followers.module';
import { ProductReactionsModule } from '../../../../core/modules/product-reactions/product-reactions.module';
import { AuthModule } from '../../../../core/modules/auth/auth.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { TokensModule } from '../../../../core/modules/token/token.module';

/**
 * Wishlists module for the users app.
 * Exposes read-only queries for followed businesses and liked products with infinite scroll.
 */
@Module({
  imports: [
    BusinessFollowersModule,
    ProductReactionsModule,
    AuthModule,
    RolesModule,
    TokensModule,
  ],
  providers: [WishlistsResolver],
  exports: [WishlistsResolver],
})
export class WishlistsModule {}
