import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { QueueNamesEnum, NotificationsConsumerEnum } from '../common/enums';
import { LogWarn } from '../common/helpers';
import { NotificationsSettersService } from '../modules/notifications/notifications-setters.service';
import { CreateNotificationParams } from '../modules/notifications/dto/create-notification.params';
import { IUserOrBusinessReq } from '../common/interfaces';

/** Payload for CreateNotificationUserJob job. */
interface CreateNotificationJobData {
  params: CreateNotificationParams;
  userOrBusinessReq: IUserOrBusinessReq;
}

/**
 * Processes notification creation jobs (user inbox vs business inbox).
 */
@Processor(QueueNamesEnum.notifications)
export class NotificationsConsumer extends WorkerHost {
  private readonly logger = new Logger(NotificationsConsumer.name);

  /**
   * @param {NotificationsSettersService} notificationsSettersService - Writes and realtime from jobs
   */
  constructor(
    private readonly notificationsSettersService: NotificationsSettersService,
  ) {
    super();
  }

  /**
   * Dispatches the job to the correct handler by job name.
   *
   * @param {Job<CreateNotificationJobData>} job - BullMQ job
   */
  async process(job: Job<CreateNotificationJobData>) {
    const jobName = job.name as NotificationsConsumerEnum;
    switch (jobName) {
      case NotificationsConsumerEnum.CreateForUser:
        await this.processCreateForUser(job);
        return;
      case NotificationsConsumerEnum.CreateForBusiness:
        await this.processCreateForBusiness(job);
        return;
      default:
        LogWarn(
          this.logger,
          `Unhandled job: ${String(job.name)}`,
          this.process.name,
        );
    }
  }

  /**
   * Persists a user inbox notification and emits realtime.
   *
   * @param {Job<CreateNotificationJobData>} job - Job with CreateNotificationJobData data
   */
  private async processCreateForUser(job: Job<CreateNotificationJobData>) {
    const { params, userOrBusinessReq } = job.data;
    await this.notificationsSettersService.createAndDispatch(
      params,
      userOrBusinessReq,
    );
  }

  /**
   * Persists a business inbox notification and optionally emits realtime.
   *
   * @param {Job} job - Job with CreateNotificationBusinessJobPayload data
   */
  private async processCreateForBusiness(job: Job<CreateNotificationJobData>) {
    const { params, userOrBusinessReq } = job.data;
    await this.notificationsSettersService.createAndDispatch(
      params,
      userOrBusinessReq,
    );
  }
}
