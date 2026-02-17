import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductVisit } from '../../entities';
import { ProductVisitsSettersService } from './product-visits-setters.service';
import { ProductsModule } from '../products/products.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ProductVisit]),
        ProductsModule
    ],
    providers: [ProductVisitsSettersService],
    exports: [ProductVisitsSettersService]
})
export class ProductVisitsModule {}
