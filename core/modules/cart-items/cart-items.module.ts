import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItem } from '../../entities';
import { CartItemsService } from './cart-items.service';
import { CartItemsGettersService } from './cart-items-getters.service';
import { CartItemsSettersService } from './cart-items-setters.service';

@Module({
  imports: [TypeOrmModule.forFeature([CartItem])],
  providers: [
    CartItemsService,
    CartItemsGettersService,
    CartItemsSettersService,
  ],
  exports: [CartItemsService, CartItemsGettersService, CartItemsSettersService],
})
/** Encapsulates CartItem persistence and domain services. */
export class CartItemsModule {}
