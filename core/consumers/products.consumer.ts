import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import {
  NotificationsConsumerEnum,
  NotificationTypeEnum,
  QueueNamesEnum,
} from '../common/enums';
import { NotificationContentScenarioEnum } from '../common/enums/notification-content-scenario.enum';
import { ProductsConsumerEnum } from '../common/enums/consumers';
import { LogWarn } from '../common/helpers';
import { IBusinessReq } from '../common/interfaces';
import { ProductsGettersService } from '../modules/products/products-getters.service';
import { ProductsSettersService } from '../modules/products/products-setters.service';
import { CreateNotificationJobData } from './notifications.consumer';

/** Payload for NotifyLowStock job. */
interface NotifyLowStockJobData {
  ids: number[];
}

/**
 * Consumer for product-related background jobs (low-stock alerts, etc.).
 */
@Processor(QueueNamesEnum.products)
export class ProductsConsumer extends WorkerHost {
  private readonly log = new Logger(ProductsConsumer.name);

  /**
   * @param {ProductsGettersService} productsGettersService - Product reads for jobs
   * @param {ProductsSettersService} productsSettersService - Product writes for jobs
   * @param {Queue} notificationsQueue - Notifications queue
   */
  constructor(
    private readonly productsGettersService: ProductsGettersService,
    private readonly productsSettersService: ProductsSettersService,
    @InjectQueue(QueueNamesEnum.notifications)
    private readonly notificationsQueue: Queue,
  ) {
    super();
  }

  /**
   * Dispatches by job name.
   *
   * @param {Job} job - BullMQ job
   */
  async process(job: Job<NotifyLowStockJobData>): Promise<void> {
    const name = job.name as ProductsConsumerEnum;
    switch (name) {
      case ProductsConsumerEnum.NotifyLowStock:
        await this.processNotifyLowStock(job);
        return;
      default:
        LogWarn(this.log, `Unhandled job: ${job.name}`, this.process.name);
    }
  }

  /**
   * Sends one business notification per product and sets stock_notified.
   *
   * @param {Job<NotifyLowStockJobData>} job - Job with product IDs
   */
  private async processNotifyLowStock(
    job: Job<NotifyLowStockJobData>,
  ): Promise<void> {
    const { ids } = job.data;
    if (!ids?.length) {
      LogWarn(
        this.log,
        `Missing ids in job ${job.id}`,
        this.processNotifyLowStock.name,
      );
      return;
    }
    for (const id of ids) {
      const product =
        await this.productsGettersService.findOneActiveSummaryForLowStockJob(
          id,
        );
      if (!product) {
        continue;
      }

      const businessReq: IBusinessReq = {
        businessId: Number(product.idCreationBusiness),
        path: '',
      };

      const catalog = await this.productsGettersService.findCatalogByProductId(
        product.id,
      );
      const payload: CreateNotificationJobData = {
        entityName: 'products',
        scenario: NotificationContentScenarioEnum.PRODUCT_LOW_STOCK,
        type: NotificationTypeEnum.WARNING,
        userOrBusinessReq: { ...businessReq },
        data: {
          id: product.id,
          catalogPath: catalog.path,
          productTitle: product.title,
        },
      };
      await this.notificationsQueue.add(
        NotificationsConsumerEnum.CreateForBusiness,
        payload,
      );
      const fullProduct = await this.productsGettersService.findOne(product.id);
      await this.productsSettersService.setStockNotified(
        fullProduct,
        true,
        businessReq,
      );
    }
  }
}
