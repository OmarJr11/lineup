import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import {
  QueueNamesEnum,
  NotificationsConsumerEnum,
  NotificationContentScenarioEnum,
  NotificationTypeEnum,
} from '../common/enums';
import { LogWarn } from '../common/helpers';
import { NotificationsSettersService } from '../modules/notifications/notifications-setters.service';
import { CreateNotificationParams } from '../modules/notifications/dto/create-notification.params';
import { IUserOrBusinessReq } from '../common/interfaces';
import { notificationsPublic } from '../common/constants';

/** Payload for CreateNotificationUserJob job. */
export interface CreateNotificationJobData {
  userOrBusinessReq: IUserOrBusinessReq;
  scenario: NotificationContentScenarioEnum;
  entityName: string;
  type: NotificationTypeEnum;
  data?: {
    id?: number;
    catalogPath?: string;
    productTitle?: string;
    [key: string]: unknown;
  };
}

/**
 * Creates notifications from the queue and dispatches Socket.IO on the background-processes app
 * (`PORT_BACKGROUND_PROCESSES`, namespace `/notifications`). GraphQL APIs do not open a socket server.
 */
@Processor(QueueNamesEnum.notifications)
export class NotificationsConsumer extends WorkerHost {
  private readonly logger = new Logger(NotificationsConsumer.name);

  /**
   * @param {NotificationsSettersService} notificationsSettersService - Persists rows and emits on the worker gateway
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
   * Persists a user inbox notification then emits to room `user:{id}` on the background socket.
   *
   * @param {Job<CreateNotificationJobData>} job - Job with CreateNotificationJobData data
   */
  private async processCreateForUser(job: Job<CreateNotificationJobData>) {
    const { entityName, userOrBusinessReq, scenario, type } = job.data;
    const notificationEntry = notificationsPublic[scenario];
    const { title, message, link } = notificationEntry.es;
    const notificationParams: CreateNotificationParams = {
      type,
      title,
      body: message,
      idUser: userOrBusinessReq.userId,
      payload: {
        idUser: userOrBusinessReq.userId,
        link,
        entity: entityName,
        scenario,
      },
    };
    await this.notificationsSettersService.createAndDispatch(
      notificationParams,
      userOrBusinessReq,
    );
  }

  /**
   * Persists a business inbox notification then emits to room `business:{id}` on the background socket.
   *
   * @param {Job} job - Job with CreateNotificationBusinessJobPayload data
   */
  private async processCreateForBusiness(job: Job<CreateNotificationJobData>) {
    const { entityName, userOrBusinessReq, scenario, type, data } = job.data;
    const notificationEntry = notificationsPublic[scenario];
    const { title, message } = notificationEntry.es;
    let link = notificationEntry.es.link;

    switch (scenario) {
      case NotificationContentScenarioEnum.DISCOUNT_ACTIVATED:
        link = `businesses/discounts/${data.id}`;
        break;
      default:
        break;
    }

    const notificationParams: CreateNotificationParams = {
      type,
      title,
      body: message,
      idBusiness: userOrBusinessReq.businessId,
      payload: {
        idBusiness: userOrBusinessReq.businessId,
        link,
        entity: entityName,
        scenario,
        id: data?.id,
        catalogPath: data?.catalogPath,
        productTitle: data?.productTitle,
      },
    };
    await this.notificationsSettersService.createAndDispatch(
      notificationParams,
      userOrBusinessReq,
    );
  }
}
