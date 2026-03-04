import { Module } from '@nestjs/common';
import { InventoryResolver } from './inventory.resolver';
import { ProductSkusModule } from '../../../../core/modules/product-skus/product-skus.module';
import { StockMovementsModule } from '../../../../core/modules/stock-movements/stock-movements.module';
import { ProductsModule } from '../../../../core/modules/products/products.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { TokensModule } from '../../../../core/modules/token/token.module';

/**
 * Module for premium inventory management.
 * Requires INVMGMT permission.
 */
@Module({
    imports: [
        ProductSkusModule,
        StockMovementsModule,
        ProductsModule,
        RolesModule,
        TokensModule,
    ],
    providers: [InventoryResolver],
})
export class InventoryModule {}
