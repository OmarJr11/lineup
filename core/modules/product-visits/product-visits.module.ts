import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductVisit } from '../../entities';
import { ProductVisitsGettersService } from './product-visits-getters.service';
import { ProductVisitsSettersService } from './product-visits-setters.service';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProductVisit]), ProductsModule],
  providers: [ProductVisitsGettersService, ProductVisitsSettersService],
  exports: [ProductVisitsGettersService, ProductVisitsSettersService],
})
export class ProductVisitsModule {}
