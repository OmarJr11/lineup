import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import {
  DiscountsConsumerEnum,
  QueueNamesEnum,
} from '../common/enums/consumers';
import {
  NotificationsConsumerEnum,
  NotificationTypeEnum,
  StatusEnum,
} from '../common/enums';
import { NotificationContentScenarioEnum } from '../common/enums/notification-content-scenario.enum';
import { IUserReq } from '../common/interfaces';
import { LogWarn } from '../common/helpers';
import { Discount } from '../entities';
import { DiscountsGettersService } from '../modules/discounts/discounts-getters.service';
import { DiscountsSettersService } from '../modules/discounts/discounts-setters.service';
import { CreateNotificationJobData } from './notifications.consumer';

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
    @InjectQueue(QueueNamesEnum.notifications)
    private readonly notificationsQueue: Queue,
  ) {
    super();
  }

  /**
   * Process incoming jobs.
   * @param {Job} job - The job to process.
   */
  async process(
    job: Job<ActivateDiscountJobData | RemoveExpiredDiscountJobData>,
  ): Promise<void> {
    const name: DiscountsConsumerEnum = job.name as DiscountsConsumerEnum;
    switch (name) {
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
    await this.enqueueBusinessNotificationsForDiscounts(
      discounts,
      NotificationContentScenarioEnum.DISCOUNT_ACTIVATED,
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
    for (const discount of discounts) {
      await this.discountsSettersService.markAsExpired(discount, userReq);
      await this.discountsSettersService.removeDiscount(discount, userReq);
    }
    await this.enqueueBusinessNotificationsForDiscounts(
      discounts,
      NotificationContentScenarioEnum.DISCOUNT_EXPIRED,
    );
  }

  /**
   * Enqueues one business inbox notification per discount for the owning business.
   *
   * @param {Discount[]} discounts - Discounts that were activated or expired.
   * @param {NotificationContentScenarioEnum} scenario - Activated vs expired copy.
   */
  private async enqueueBusinessNotificationsForDiscounts(
    discounts: Discount[],
    scenario: NotificationContentScenarioEnum,
  ): Promise<void> {
    for (const discount of discounts) {
      const payload: CreateNotificationJobData = {
        entityName: 'discounts',
        scenario,
        type: NotificationTypeEnum.INFO,
        userOrBusinessReq: {
          businessId: Number(discount.idCreationBusiness),
          path: '',
        },
        data: {
          id: discount.id,
        },
      };
      await this.notificationsQueue.add(
        NotificationsConsumerEnum.CreateForBusiness,
        payload,
      );
    }
  }
}
