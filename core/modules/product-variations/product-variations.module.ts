import { Module } from '@nestjs/common';
import { ProductVariationsService } from './product-variations.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductVariation } from '../../entities';
import { ProductVariationsGettersService } from './product-variations-getters.service';
import { ProductVariationsSettersService } from './product-variations-setters.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductVariation]),
  ],
  providers: [
    ProductVariationsService,
    ProductVariationsGettersService,
    ProductVariationsSettersService
  ],
  exports: [
    ProductVariationsService,
    ProductVariationsGettersService,
    ProductVariationsSettersService
  ]
})
export class ProductVariationsModule {}
