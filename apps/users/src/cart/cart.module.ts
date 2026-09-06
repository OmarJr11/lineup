import { Module } from '@nestjs/common';
import { CartModule as CartModuleCore } from '../../../../core/modules/cart/cart.module';
import { TokensModule } from '../../../../core/modules/token/token.module';
import { CartResolver } from './cart.resolver';

/** GraphQL module for authenticated user cart operations. */
@Module({
  imports: [CartModuleCore, TokensModule],
  providers: [CartResolver],
  exports: [CartResolver],
})
export class CartModule {}
