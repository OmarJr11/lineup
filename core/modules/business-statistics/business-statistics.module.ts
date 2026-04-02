import { Module } from '@nestjs/common';
import { BusinessStatisticsGettersService } from './business-statistics-getters.service';
import { BusinessVisitsModule } from '../business-visits/business-visits.module';
import { BusinessFollowersModule } from '../business-followers/business-followers.module';
import { ProductVisitsModule } from '../product-visits/product-visits.module';
import { CatalogVisitsModule } from '../catalog-visits/catalog-visits.module';
import { ProductsModule } from '../products/products.module';
import { CatalogsModule } from '../catalogs/catalogs.module';
import { DiscountsModule } from '../discounts/discounts.module';
import { ProductSkusModule } from '../product-skus/product-skus.module';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';

@Module({
  imports: [
    BusinessVisitsModule,
    BusinessFollowersModule,
    ProductVisitsModule,
    CatalogVisitsModule,
    ProductsModule,
    CatalogsModule,
    DiscountsModule,
    ProductSkusModule,
    StockMovementsModule,
  ],
  providers: [BusinessStatisticsGettersService],
  exports: [BusinessStatisticsGettersService],
})
export class BusinessStatisticsModule {}
