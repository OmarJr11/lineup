import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  DiscountsConsumerEnum,
  QueueNamesEnum,
} from '../common/enums/consumers';
import { StatusEnum } from '../common/enums';
import { IUserReq } from '../common/interfaces';
import { LogWarn } from '../common/helpers';
import { DiscountsGettersService } from '../modules/discounts/discounts-getters.service';
import { DiscountsSettersService } from '../modules/discounts/discounts-setters.service';

/** Payload for ActivateDiscount job. */
interface ActivateDiscountJobData {
  ids: number[];
}

/** Payload for RemoveExpiredDiscount job. */
interface RemoveExpiredDiscountJobData {
  ids: number[];
}

/**
 * Consumer for discount-related background jobs.
 * ActivateDiscount and RemoveExpiredDiscount (cron-triggered).
 * Audit recording is handled by EntityAuditsConsumer.
 */
@Processor(QueueNamesEnum.discounts)
export class DiscountsConsumer extends WorkerHost {
  private readonly log = new Logger(DiscountsConsumer.name);

  constructor(
    private readonly discountsGettersService: DiscountsGettersService,
    private readonly discountsSettersService: DiscountsSettersService,
  ) {
    super();
  }

  /**
   * Process incoming jobs.
   * @param {Job} job - The job to process.
   */
  async process(job: Job): Promise<void> {
    switch (job.name) {
      case DiscountsConsumerEnum.ActivateDiscount:
        await this.processActivateDiscount(job);
        break;
      case DiscountsConsumerEnum.RemoveExpiredDiscount:
        await this.processRemoveExpiredDiscount(job);
        break;
      default:
        LogWarn(this.log, `Unhandled job: ${job.name}`, this.process.name);
    }
  }

  /**
   * Activates a PENDING discount by setting status to ACTIVE.
   * @param {Job<ActivateDiscountJobData>} job - BullMQ job with discount ID.
   */
  private async processActivateDiscount(
    job: Job<ActivateDiscountJobData>,
  ): Promise<void> {
    const { ids } = job.data;
    if (!ids || ids.length === 0) {
      LogWarn(
        this.log,
        `Missing ids in job ${job.id}`,
        this.processActivateDiscount.name,
      );
      return;
    }
    const discounts = await this.discountsGettersService.findAllByIds(ids);
    const userReq: IUserReq = { userId: 1, username: 'admin' };
    await this.discountsSettersService.updateMany(
      StatusEnum.ACTIVE,
      discounts,
      userReq,
    );
  }

  /**
   * Removes (soft delete) expired ACTIVE discounts by setting status to DELETED.
   * @param {Job<RemoveExpiredDiscountJobData>} job - BullMQ job with discount IDs.
   */
  private async processRemoveExpiredDiscount(
    job: Job<RemoveExpiredDiscountJobData>,
  ) {
    const { ids } = job.data;
    if (!ids || ids.length === 0) {
      LogWarn(
        this.log,
        `Missing ids in job ${job.id}`,
        this.processRemoveExpiredDiscount.name,
      );
      return;
    }
    const discounts = await this.discountsGettersService.findAllByIds(ids);
    const userReq: IUserReq = { userId: 1, username: 'admin' };
    for (const discount of discounts)
      await this.discountsSettersService.removeDiscount(discount, userReq);
  }
}
