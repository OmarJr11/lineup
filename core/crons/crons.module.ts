import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { QueueNamesEnum } from '../common/enums';
import { BcvCurrencyCronService } from './bcv-currency.cron';
import { DiscountsCronService } from './discounts.cron';
import { DiscountsModule } from '../modules/discounts/discounts.module';
import { ProductsModule } from '../modules/products/products.module';
import { ProductsCronService } from './products.cron';

/**
 * Module that registers scheduled cron jobs.
 * Imported by the background-processes application.
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue(
      { name: QueueNamesEnum.discounts },
      { name: QueueNamesEnum.products },
      { name: QueueNamesEnum.currency },
    ),
    DiscountsModule,
    ProductsModule,
  ],
  providers: [
    BcvCurrencyCronService,
    DiscountsCronService,
    ProductsCronService,
  ],
})
export class CronsModule {}
