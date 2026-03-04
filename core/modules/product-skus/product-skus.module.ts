import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductSku } from '../../entities';
import { ProductSkusService } from './product-skus.service';
import { ProductSkusGettersService } from './product-skus-getters.service';
import { ProductSkusSettersService } from './product-skus-setters.service';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';

/**
 * Module that encapsulates all product SKU (stock) functionality.
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([ProductSku]),
        StockMovementsModule,
    ],
    providers: [
        ProductSkusService,
        ProductSkusGettersService,
        ProductSkusSettersService,
    ],
    exports: [
        ProductSkusService,
        ProductSkusGettersService,
        ProductSkusSettersService,
    ],
})
export class ProductSkusModule {}
