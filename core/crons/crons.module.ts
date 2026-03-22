import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { QueueNamesEnum } from '../common/enums';
import { DiscountsCronService } from './discounts.cron';
import { DiscountsModule } from '../modules/discounts/discounts.module';

/**
 * Module that registers scheduled cron jobs.
 * Used by the admin app for background tasks.
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({ name: QueueNamesEnum.discounts }),
    DiscountsModule,
  ],
  providers: [DiscountsCronService],
})
export class CronsModule {}
