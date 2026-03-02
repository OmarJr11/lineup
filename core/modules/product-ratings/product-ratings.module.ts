import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductRating } from '../../entities';
import { ProductRatingsService } from './product-ratings.service';
import { ProductRatingsGettersService } from './product-ratings-getters.service';
import { ProductRatingsSettersService } from './product-ratings-setters.service';
import { ProductsModule } from '../products/products.module';
import { BullModule } from '@nestjs/bullmq';
import { QueueNamesEnum } from '../../common/enums';

/**
 * Module that encapsulates all product rating functionality.
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([ProductRating]),
        ProductsModule,
        BullModule.registerQueue(
            {
                name: QueueNamesEnum.reviews,
                defaultJobOptions: { removeOnComplete: true },
            },
        ),
    ],
    providers: [
        ProductRatingsService,
        ProductRatingsGettersService,
        ProductRatingsSettersService,
    ],
    exports: [
        ProductRatingsService,
        ProductRatingsGettersService,
        ProductRatingsSettersService,
    ],
})
export class ProductRatingsModule {}
