import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import {
  CurrencyConsumerEnum,
  QueueNamesEnum,
} from '../common/enums/consumers';

/**
 * Enqueues BCV rate sync jobs at midnight Venezuela time.
 * Actual scraping runs in {@link CurrencyConsumer}.
 */
@Injectable()
export class BcvCurrencyCronService implements OnModuleInit {
  private readonly logger = new Logger(BcvCurrencyCronService.name);

  /**
   * @param currencyQueue - Bull queue processed by {@link CurrencyConsumer}.
   */
  constructor(
    @InjectQueue(QueueNamesEnum.currency)
    private readonly currencyQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.enqueueSaveBcvOfficialRates();
  }

  /**
   * Adds a {@link CurrencyConsumerEnum.SaveDataCurrencyBCV} job every day at 00:00 `America/Caracas`.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'America/Caracas' })
  async enqueueSaveBcvOfficialRates(): Promise<void> {
    await this.currencyQueue.add(CurrencyConsumerEnum.SaveDataCurrencyBCV, {});
    this.logger.log(
      `Enqueued ${CurrencyConsumerEnum.SaveDataCurrencyBCV}`,
      this.enqueueSaveBcvOfficialRates.name,
    );
  }
}
