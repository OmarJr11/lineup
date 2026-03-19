import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Discount } from '../../entities';
import { DiscountsService } from './discounts.service';
import { DiscountsGettersService } from './discounts-getters.service';
import { DiscountsSettersService } from './discounts-setters.service';
import { DiscountProductsModule } from '../discount-products/discount-products.module';
import { EntityAuditsModule } from '../entity-audits/entity-audits.module';
import { ProductsModule } from '../products/products.module';
import { CatalogsModule } from '../catalogs/catalogs.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { QueueNamesEnum } from '../../common/enums';

/**
 * Module that encapsulates discount functionality.
 * Supports business, catalog, and product-scoped discounts with audit.
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([Discount]),
        BullModule.registerQueue({ name: QueueNamesEnum.discounts }),
        DiscountProductsModule,
        EntityAuditsModule,
        ProductsModule,
        CatalogsModule,
        BusinessesModule,
    ],
    providers: [
        DiscountsService,
        DiscountsGettersService,
        DiscountsSettersService,
    ],
    exports: [
        DiscountsService,
        DiscountsGettersService,
        DiscountsSettersService,
    ],
})
export class DiscountsModule {}
