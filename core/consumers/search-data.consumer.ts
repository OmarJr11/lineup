import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueNamesEnum } from '../common/enums/consumers';
import { SearchDataConsumerEnum, VisitTypeEnum } from '../common/enums';
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

/** Payload for visit record job. Updates search index counters when a visit is recorded. */
interface SearchDataVisitRecordJobData { type: VisitTypeEnum; id: number; }

/** Payload for business follow record job. Updates business_search_index.followers on follow/unfollow. */
interface SearchDataBusinessFollowRecordJobData { idBusiness: number; action: 'follow' | 'unfollow'; }

/** Payload for product like record job. Updates product, catalog and business search index likes on like/unlike. */
interface SearchDataProductLikeRecordJobData { idProduct: number; action: 'like' | 'unlike'; }

/** Payload for product rating record job. Updates product_search_index.rating_average. */
interface SearchDataProductRatingRecordJobData { idProduct: number; ratingAverage: number; }

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
      case SearchDataConsumerEnum.SearchDataVisitRecord:
        await this.processVisitRecord(job);
        break;
      case SearchDataConsumerEnum.SearchDataBusinessFollowRecord:
        await this.processBusinessFollowRecord(job);
        break;
      case SearchDataConsumerEnum.SearchDataProductLikeRecord:
        await this.processProductLikeRecord(job);
        break;
      case SearchDataConsumerEnum.SearchDataProductRatingRecord:
        await this.processProductRatingRecord(job);
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

  /**
   * Processes a visit record job. Increments the appropriate search index counters.
   * - BUSINESS: business_search_index.visits
   * - CATALOG: catalog_search_index.visits, business_search_index.catalog_visits_total
   * - PRODUCT: product_search_index.visits, catalog_search_index.product_visits_total, business_search_index.product_visits_total
   * @param {Job<SearchDataVisitRecordJobData>} job - BullMQ job with { type, id }.
   */
  private async processVisitRecord(job: Job<SearchDataVisitRecordJobData>): Promise<void> {
    const { type, id } = job.data;
    if (!type || !id) {
      LogWarn(this.log, `Missing type or id in visit record job ${job.id}`, this.processVisitRecord.name);
      return;
    }
    switch (type) {
      case VisitTypeEnum.BUSINESS:
        await this.searchIndexService.incrementBusinessVisits(id);
        break;
      case VisitTypeEnum.CATALOG: {
        const catalog = await this.catalogsGettersService.findOne(id);
        await this.searchIndexService.incrementCatalogVisits(id);
        await this.searchIndexService.incrementBusinessCatalogVisitsTotal(catalog.idCreationBusiness);
        break;
      }
      case VisitTypeEnum.PRODUCT: {
        const product = await this.productsGettersService.findOne(id);
        await this.searchIndexService.incrementProductVisits(id);
        await this.searchIndexService.incrementCatalogProductVisitsTotal(product.idCatalog);
        await this.searchIndexService.incrementBusinessProductVisitsTotal(product.idCreationBusiness);
        break;
      }
      default:
        LogWarn(this.log, `Unknown visit type: ${type}`, this.processVisitRecord.name);
    }
  }

  /**
   * Processes a business follow record job. Increments or decrements business_search_index.followers.
   * @param {Job<SearchDataBusinessFollowRecordJobData>} job - BullMQ job with { idBusiness, action }.
   */
  private async processBusinessFollowRecord(job: Job<SearchDataBusinessFollowRecordJobData>): Promise<void> {
    const { idBusiness, action } = job.data;
    if (!idBusiness || !action) {
      LogWarn(this.log, `Missing idBusiness or action in follow record job ${job.id}`, this.processBusinessFollowRecord.name);
      return;
    }
    if (action === 'follow') {
      await this.searchIndexService.incrementBusinessFollowers(idBusiness);
    } else if (action === 'unfollow') {
      await this.searchIndexService.decrementBusinessFollowers(idBusiness);
    } else {
      LogWarn(this.log, `Unknown follow action: ${action}`, this.processBusinessFollowRecord.name);
    }
  }

  /**
   * Processes a product like record job. Increments or decrements likes in product, catalog and business search indexes.
   * - product_search_index.likes
   * - catalog_search_index.product_likes_total
   * - business_search_index.product_likes_total
   * @param {Job<SearchDataProductLikeRecordJobData>} job - BullMQ job with { idProduct, action }.
   */
  private async processProductLikeRecord(job: Job<SearchDataProductLikeRecordJobData>): Promise<void> {
    const { idProduct, action } = job.data;
    if (!idProduct || !action) {
      LogWarn(this.log, `Missing idProduct or action in product like record job ${job.id}`, this.processProductLikeRecord.name);
      return;
    }
    const product = await this.productsGettersService.findOne(idProduct);
    if (action === 'like') {
      await this.searchIndexService.incrementProductLikes(idProduct);
      await this.searchIndexService.incrementCatalogProductLikesTotal(product.idCatalog);
      await this.searchIndexService.incrementBusinessProductLikesTotal(product.idCreationBusiness);
    } else if (action === 'unlike') {
      await this.searchIndexService.decrementProductLikes(idProduct);
      await this.searchIndexService.decrementCatalogProductLikesTotal(product.idCatalog);
      await this.searchIndexService.decrementBusinessProductLikesTotal(product.idCreationBusiness);
    } else {
      LogWarn(this.log, `Unknown like action: ${action}`, this.processProductLikeRecord.name);
    }
  }

  /**
   * Processes a product rating record job.
   * Updates product_search_index.rating_average with the newly computed value.
   * @param {Job<SearchDataProductRatingRecordJobData>} job - BullMQ job with { idProduct, ratingAverage }.
   */
  private async processProductRatingRecord(job: Job<SearchDataProductRatingRecordJobData>): Promise<void> {
    const { idProduct, ratingAverage } = job.data;
    if (!idProduct || ratingAverage === undefined) {
      LogWarn(this.log, `Missing idProduct or ratingAverage in product rating record job ${job.id}`, this.processProductRatingRecord.name);
      return;
    }
    await this.searchIndexService.updateProductRatingAverage(idProduct, ratingAverage);
  }
}
