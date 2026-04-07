import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import {
  ProductsConsumerEnum,
  QueueNamesEnum,
} from '../common/enums/consumers';
import { ProductsGettersService } from '../modules/products/products-getters.service';

/**
 * Scheduled jobs for product inventory (low-stock alerts).
 */
@Injectable()
export class ProductsCronService {
  private readonly logger = new Logger(ProductsCronService.name);

  /**
   * @param {ProductsGettersService} productsGettersService - Finds products for alerts
   * @param {Queue} productsQueue - Bull queue for product background jobs
   */
  constructor(
    private readonly productsGettersService: ProductsGettersService,
    @InjectQueue(QueueNamesEnum.products)
    private readonly productsQueue: Queue,
  ) {}

  /**
   * Clears stock_notified when stock is no longer low, then enqueues notifications
   * for active products with SKU quantity in [0, 5] and stock_notified false.
   * Runs daily at midnight (America/Caracas).
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'America/Caracas' })
  async enqueueLowStockNotifications(): Promise<void> {
    await this.productsGettersService.resetStockNotifiedForRestockedProducts();
    const ids =
      await this.productsGettersService.findProductIdsWithLowStockPendingNotification();
    if (ids.length === 0) {
      return;
    }
    await this.productsQueue.add(ProductsConsumerEnum.NotifyLowStock, { ids });
    this.logger.log(
      `Enqueued ${ProductsConsumerEnum.NotifyLowStock} for ${String(ids.length)} product(s)`,
      this.enqueueLowStockNotifications.name,
    );
  }
}
