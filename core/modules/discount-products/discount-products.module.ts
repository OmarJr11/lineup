import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscountProduct } from '../../entities';
import { DiscountProductsService } from './discount-products.service';
import { DiscountProductsGettersService } from './discount-products-getters.service';
import { DiscountProductsSettersService } from './discount-products-setters.service';

/**
 * Module for discount-product (product-discount assignment) entity.
 */
@Module({
  imports: [TypeOrmModule.forFeature([DiscountProduct])],
  providers: [
    DiscountProductsService,
    DiscountProductsGettersService,
    DiscountProductsSettersService,
  ],
  exports: [
    DiscountProductsService,
    DiscountProductsGettersService,
    DiscountProductsSettersService,
  ],
})
export class DiscountProductsModule {}
