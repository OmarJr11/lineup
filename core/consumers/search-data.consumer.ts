import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueNamesEnum } from '../common/enums/consumers';
import { SearchDataConsumerEnum } from '../common/enums';
import { BusinessesGettersService } from '../modules/businesses/businesses-getters.service';
import { CatalogsGettersService } from '../modules/catalogs/catalogs-getters.service';
import { ProductsGettersService } from '../modules/products/products-getters.service';
import { SearchIndexService } from '../modules/search/search-index.service';
import { LogError, LogWarn } from '../common/helpers';

/** Payload for product search index job. */
interface SearchDataProductJobData { idProduct: number; }

/** Payload for business search index job. */
interface SearchDataBusinessJobData { idBusiness: number; }

/** Payload for catalog search index job. */
interface SearchDataCatalogJobData { idCatalog: number; }

@Processor(QueueNamesEnum.searchData)
export class SearchDataConsumer extends WorkerHost {
  private readonly log = new Logger(SearchDataConsumer.name);

  constructor(
    private readonly businessesGettersService: BusinessesGettersService,
    private readonly catalogsGettersService: CatalogsGettersService,
    private readonly productsGettersService: ProductsGettersService,
    private readonly searchIndexService: SearchIndexService,
  ) {
    super();
  }

  /**
   * Process incoming jobs.
   * @param {Job} job - The job to process.
   */
  async process(job: Job): Promise<void> {
    switch (job.name) {
      case SearchDataConsumerEnum.SearchDataProduct:
        await this.setDataInSearchIndexProduct(job);
        break;
      case SearchDataConsumerEnum.SearchDataBusiness:
        await this.setDataInSearchIndexBusiness(job);
        break;
      case SearchDataConsumerEnum.SearchDataCatalog:
        await this.setDataInSearchIndexCatalog(job);
        break;
      default:
        LogWarn(this.log, `Unhandled job: ${job.name}`, this.process.name);
    }
  }

  /**
   * Creates or updates the product search index for the product in job.data.
   * @param {Job<SearchDataProductJobData>} job - BullMQ job with { idProduct }.
   */
  private async setDataInSearchIndexProduct(job: Job<SearchDataProductJobData>): Promise<void> {
    const { idProduct } = job.data;
    if (!idProduct) {
      LogWarn(this.log, `Missing idProduct in job ${job.id}`, this.setDataInSearchIndexProduct.name);
      return;
    }
    const product = await this.productsGettersService.findOneWithRelations(idProduct);
    await this.searchIndexService.upsertProductSearchIndex(product);
  }

  /**
   * Creates or updates the business search index for the business in job.data.
   * @param {Job<SearchDataBusinessJobData>} job - BullMQ job with { idBusiness }.
   */
  private async setDataInSearchIndexBusiness(job: Job<SearchDataBusinessJobData>): Promise<void> {
    const { idBusiness } = job.data;
    if (!idBusiness) {
      LogWarn(this.log, `Missing idBusiness in job ${job.id}`, this.setDataInSearchIndexBusiness.name);
      return;
    }
    const business = await this.businessesGettersService.findOne(idBusiness);
    await this.searchIndexService.upsertBusinessSearchIndex(business);
  }

  /**
   * Creates or updates the catalog search index for the catalog in job.data.
   * @param {Job<SearchDataCatalogJobData>} job - BullMQ job with { idCatalog }.
   */
  private async setDataInSearchIndexCatalog(job: Job<SearchDataCatalogJobData>): Promise<void> {
    const { idCatalog } = job.data;
    if (!idCatalog) {
      LogWarn(this.log, `Missing idCatalog in job ${job.id}`, this.setDataInSearchIndexCatalog.name);
      return;
    }
    const catalog = await this.catalogsGettersService.findOne(idCatalog);
    await this.searchIndexService.upsertCatalogSearchIndex(catalog);
  }
}
