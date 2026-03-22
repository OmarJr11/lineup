import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { BusinessVisitsModule } from '../business-visits/business-visits.module';
import { ProductVisitsModule } from '../product-visits/product-visits.module';
import { CatalogVisitsModule } from '../catalog-visits/catalog-visits.module';
import { ProductsModule } from '../products/products.module';
import { ProductSkusModule } from '../product-skus/product-skus.module';
import { DiscountsModule } from '../discounts/discounts.module';
import { AdminStatisticsGettersService } from './admin-statistics-getters.service';

/**
 * Core module exposing platform-wide statistics for the admin application.
 */
@Module({
  imports: [
    UsersModule,
    BusinessesModule,
    BusinessVisitsModule,
    ProductVisitsModule,
    CatalogVisitsModule,
    ProductsModule,
    ProductSkusModule,
    DiscountsModule,
  ],
  providers: [AdminStatisticsGettersService],
  exports: [AdminStatisticsGettersService],
})
export class AdminStatisticsModule {}
