import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueNamesEnum } from '../common/enums';
import { ProductsConsumerEnum } from '../common/enums';
import { ProductTagsService } from '../modules/product-tags/product-tags.service';
import { LogError, LogWarn } from '../common/helpers';
import { IBusinessReq } from '../common/interfaces';
import { productsResponses } from '../common/responses';

/** Payload for translate tags and update product job. */
interface TranslateTagsAndUpdateProductJobData {
  idProduct: number;
  tags: string[];
  businessReq: IBusinessReq;
}

/**
 * Consumer for product-related background jobs.
 * Delegates to ProductTagsService: translate tags → save in Tag entity → update product (product_tags).
 */
@Processor(QueueNamesEnum.products)
export class ProductsConsumer extends WorkerHost {
  private readonly log = new Logger(ProductsConsumer.name);
  private readonly rUpdate = productsResponses.update;

  constructor(private readonly productTagsService: ProductTagsService) {
    super();
  }

  /**
   * Process incoming jobs.
   * @param {Job} job - The job to process.
   */
  async process(job: Job): Promise<void> {
    switch (job.name) {
      case ProductsConsumerEnum.TranslateTagsAndUpdateProduct:
        await this.translateTagsAndUpdateProduct(job);
        break;
      default:
        LogWarn(this.log, `Unhandled job: ${job.name}`, this.process.name);
    }
  }

  /**
   * Translates tags, saves them in Tag entity, and updates the product.
   * Persistence of product_tags happens in ProductTagsService.
   * @param {Job<TranslateTagsAndUpdateProductJobData>} job - BullMQ job with { idProduct, tags, businessReq }.
   */
  private async translateTagsAndUpdateProduct(
    job: Job<TranslateTagsAndUpdateProductJobData>
  ): Promise<void> {
    const { idProduct, tags, businessReq } = job.data;
    if (!idProduct || !tags?.length) {
      LogWarn(
        this.log,
        `Missing idProduct or tags in job ${job.id}`,
        this.translateTagsAndUpdateProduct.name
      );
      return;
    }
    try {
      await this.productTagsService.processAndUpdateProductTags(
        idProduct,
        tags,
        businessReq
      );
    } catch (error) {
      LogError(this.log, error, this.translateTagsAndUpdateProduct.name);
      throw new InternalServerErrorException(this.rUpdate.error);
    }
  }
}
