import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from '../../entities';
import { ProductsModule } from '../products/products.module';
import { ProductSkusModule } from '../product-skus/product-skus.module';
import { CartItemsModule } from '../cart-items/cart-items.module';
import { CartService } from './cart.service';
import { CartGettersService } from './cart-getters.service';
import { CartSettersService } from './cart-setters.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart]),
    CartItemsModule,
    ProductsModule,
    ProductSkusModule,
  ],
  providers: [CartService, CartGettersService, CartSettersService],
  exports: [CartService, CartGettersService, CartSettersService],
})
/** Provides cart orchestration and its entity-specific dependencies. */
export class CartModule {}
