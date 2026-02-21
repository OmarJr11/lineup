import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProductReactionsService } from './product-reactions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductReaction } from '../../entities';
import { ProductReactionsGettersService } from './product-reactions-getters.service';
import { ProductReactionsSettersService } from './product-reactions-setters.service';
import { ProductsModule } from '../products/products.module';
import { QueueNamesEnum } from '../../common/enums';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductReaction]),
    ProductsModule,
    BullModule.registerQueue({
      name: QueueNamesEnum.searchData,
      defaultJobOptions: { removeOnComplete: true },
    }),
  ],
  providers: [
    ProductReactionsService,
    ProductReactionsGettersService,
    ProductReactionsSettersService
  ],
  exports: [
    ProductReactionsService,
    ProductReactionsGettersService,
    ProductReactionsSettersService
  ]
})
export class ProductReactionsModule {}
