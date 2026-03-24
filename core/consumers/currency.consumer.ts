import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  CurrencyConsumerEnum,
  QueueNamesEnum,
} from '../common/enums/consumers';
import { LogWarn } from '../common/helpers';
import { ScrappingCacheService } from '../modules/scrapping/scrapping.service';

/**
 * Consumer for currency-related BullMQ jobs (BCV official rates snapshot).
 */
@Processor(QueueNamesEnum.currency)
export class CurrencyConsumer extends WorkerHost {
  private readonly log = new Logger(CurrencyConsumer.name);

  /**
   * @param scrappingCacheService - BCV scrape + Redis snapshot service.
   */
  constructor(private readonly scrappingCacheService: ScrappingCacheService) {
    super();
  }

  /**
   * Dispatches by job name.
   *
   * @param job - Incoming BullMQ job.
   */
  async process(job: Job): Promise<void> {
    switch (job.name as CurrencyConsumerEnum) {
      case CurrencyConsumerEnum.SaveDataCurrencyBCV:
        await this.processSaveDataCurrencyBCV();
        break;
      default:
        LogWarn(this.log, `Unhandled job: ${job.name}`, this.process.name);
    }
  }

  /**
   * Runs the BCV page scrape and updates cache when the published date matches today (Caracas).
   */
  private async processSaveDataCurrencyBCV(): Promise<void> {
    await this.scrappingCacheService.syncBcvOfficialRatesToCache();
  }
}
