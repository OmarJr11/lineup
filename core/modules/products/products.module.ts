import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../entities';
import { ProductsGettersService } from './products-getters.service';
import { ProductsSettersService } from './products-setters.service';
import { ProductFilesModule } from '../product-files/product-files.module';
import { ProductVariationsModule } from '../product-variations/product-variations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    ProductFilesModule,
    ProductVariationsModule
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
