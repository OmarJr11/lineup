import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../entities';
import { ProductsGettersService } from './products-getters.service';
import { ProductsSettersService } from './products-setters.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
  ],
  providers: [
    ProductsService,
    ProductsGettersService,
    ProductsSettersService
  ],
  exports: [
    ProductsService,
    ProductsGettersService,
    ProductsSettersService
  ]
})
export class ProductsModule {}
