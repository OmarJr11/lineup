import { Job } from 'bullmq';
import { SearchDataConsumer } from './search-data.consumer';
import { BusinessesGettersService } from '../modules/businesses/businesses-getters.service';
import { CatalogsGettersService } from '../modules/catalogs/catalogs-getters.service';
import { ProductsGettersService } from '../modules/products/products-getters.service';
import { SearchIndexService } from '../modules/search/search-index.service';
import { SearchDataConsumerEnum } from '../common/enums/consumers';
import { VisitTypeEnum } from '../common/enums';

/**
 * Unit tests for {@link SearchDataConsumer}.
 */
describe('SearchDataConsumer', () => {
  let consumer: SearchDataConsumer;
  const businessesGettersServiceMock = {
    findOne: jest.fn(),
  };
  const catalogsGettersServiceMock = {
    findOne: jest.fn(),
  };
  const productsGettersServiceMock = {
    findOne: jest.fn(),
    findOneWithRelations: jest.fn(),
  };
  const searchIndexServiceMock = {
    upsertProductSearchIndex: jest.fn(),
    upsertBusinessSearchIndex: jest.fn(),
    upsertCatalogSearchIndex: jest.fn(),
    incrementBusinessVisits: jest.fn(),
    incrementCatalogVisits: jest.fn(),
    incrementBusinessCatalogVisitsTotal: jest.fn(),
    incrementProductVisits: jest.fn(),
    incrementCatalogProductVisitsTotal: jest.fn(),
    incrementBusinessProductVisitsTotal: jest.fn(),
    incrementBusinessFollowers: jest.fn(),
    decrementBusinessFollowers: jest.fn(),
    incrementProductLikes: jest.fn(),
    incrementCatalogProductLikesTotal: jest.fn(),
    incrementBusinessProductLikesTotal: jest.fn(),
    decrementProductLikes: jest.fn(),
    decrementCatalogProductLikesTotal: jest.fn(),
    decrementBusinessProductLikesTotal: jest.fn(),
    updateProductRatingAverage: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consumer = new SearchDataConsumer(
      businessesGettersServiceMock as unknown as BusinessesGettersService,
      catalogsGettersServiceMock as unknown as CatalogsGettersService,
      productsGettersServiceMock as unknown as ProductsGettersService,
      searchIndexServiceMock as unknown as SearchIndexService,
    );
  });

  it('SearchDataProduct skips when idProduct missing', async () => {
    const job = {
      name: SearchDataConsumerEnum.SearchDataProduct,
      data: {},
    } as Job;
    await consumer.process(job);
    expect(
      productsGettersServiceMock.findOneWithRelations,
    ).not.toHaveBeenCalled();
  });

  it('SearchDataProduct upserts index', async () => {
    const product = { id: 1 };
    productsGettersServiceMock.findOneWithRelations.mockResolvedValue(product);
    const job = {
      name: SearchDataConsumerEnum.SearchDataProduct,
      data: { idProduct: 1 },
    } as Job;
    await consumer.process(job);
    expect(
      searchIndexServiceMock.upsertProductSearchIndex,
    ).toHaveBeenCalledWith(product);
  });

  it('SearchDataBusinessFollowRecord increments on follow', async () => {
    const job = {
      name: SearchDataConsumerEnum.SearchDataBusinessFollowRecord,
      data: { idBusiness: 5, action: 'follow' },
    } as Job;
    await consumer.process(job);
    expect(
      searchIndexServiceMock.incrementBusinessFollowers,
    ).toHaveBeenCalledWith(5);
  });

  it('SearchDataVisitRecord handles BUSINESS type', async () => {
    const job = {
      name: SearchDataConsumerEnum.SearchDataVisitRecord,
      data: { type: VisitTypeEnum.BUSINESS, id: 9 },
    } as Job;
    await consumer.process(job);
    expect(
      searchIndexServiceMock.incrementBusinessVisits,
    ).toHaveBeenCalledWith(9);
  });

  it('SearchDataBusiness handles missing id or upserts index', async () => {
    await consumer.process({
      name: SearchDataConsumerEnum.SearchDataBusiness,
      data: {},
    } as Job);
    expect(businessesGettersServiceMock.findOne).not.toHaveBeenCalled();

    const business = { id: 10, name: 'Biz' };
    businessesGettersServiceMock.findOne.mockResolvedValue(business);
    await consumer.process({
      name: SearchDataConsumerEnum.SearchDataBusiness,
      data: { idBusiness: 10 },
    } as Job);
    expect(searchIndexServiceMock.upsertBusinessSearchIndex).toHaveBeenCalledWith(business);
  });

  it('SearchDataCatalog handles missing id or upserts index', async () => {
    await consumer.process({
      name: SearchDataConsumerEnum.SearchDataCatalog,
      data: {},
    } as Job);
    expect(catalogsGettersServiceMock.findOne).not.toHaveBeenCalled();

    const catalog = { id: 20, name: 'Cat' };
    catalogsGettersServiceMock.findOne.mockResolvedValue(catalog);
    await consumer.process({
      name: SearchDataConsumerEnum.SearchDataCatalog,
      data: { idCatalog: 20 },
    } as Job);
    expect(searchIndexServiceMock.upsertCatalogSearchIndex).toHaveBeenCalledWith(catalog);
  });

  it('SearchDataVisitRecord handles CATALOG type', async () => {
    const catalog = { id: 5, idCreationBusiness: 12 };
    catalogsGettersServiceMock.findOne.mockResolvedValue(catalog);

    const job = {
      name: SearchDataConsumerEnum.SearchDataVisitRecord,
      data: { type: VisitTypeEnum.CATALOG, id: 5 },
    } as Job;
    await consumer.process(job);

    expect(searchIndexServiceMock.incrementCatalogVisits).toHaveBeenCalledWith(5);
    expect(searchIndexServiceMock.incrementBusinessCatalogVisitsTotal).toHaveBeenCalledWith(12);
  });

  it('SearchDataVisitRecord handles PRODUCT type', async () => {
    const product = { id: 8, idCatalog: 3, idCreationBusiness: 15 };
    productsGettersServiceMock.findOne.mockResolvedValue(product);

    const job = {
      name: SearchDataConsumerEnum.SearchDataVisitRecord,
      data: { type: VisitTypeEnum.PRODUCT, id: 8 },
    } as Job;
    await consumer.process(job);

    expect(searchIndexServiceMock.incrementProductVisits).toHaveBeenCalledWith(8);
    expect(searchIndexServiceMock.incrementCatalogProductVisitsTotal).toHaveBeenCalledWith(3);
    expect(searchIndexServiceMock.incrementBusinessProductVisitsTotal).toHaveBeenCalledWith(15);
  });

  it('SearchDataBusinessFollowRecord decrements on unfollow', async () => {
    const job = {
      name: SearchDataConsumerEnum.SearchDataBusinessFollowRecord,
      data: { idBusiness: 5, action: 'unfollow' },
    } as Job;
    await consumer.process(job);
    expect(searchIndexServiceMock.decrementBusinessFollowers).toHaveBeenCalledWith(5);
  });

  it('SearchDataProductLikeRecord handles like and unlike', async () => {
    const product = { id: 4, idCatalog: 2, idCreationBusiness: 9 };
    productsGettersServiceMock.findOne.mockResolvedValue(product);

    await consumer.process({
      name: SearchDataConsumerEnum.SearchDataProductLikeRecord,
      data: { idProduct: 4, action: 'like' },
    } as Job);
    expect(searchIndexServiceMock.incrementProductLikes).toHaveBeenCalledWith(4);
    expect(searchIndexServiceMock.incrementCatalogProductLikesTotal).toHaveBeenCalledWith(2);
    expect(searchIndexServiceMock.incrementBusinessProductLikesTotal).toHaveBeenCalledWith(9);

    await consumer.process({
      name: SearchDataConsumerEnum.SearchDataProductLikeRecord,
      data: { idProduct: 4, action: 'unlike' },
    } as Job);
    expect(searchIndexServiceMock.decrementProductLikes).toHaveBeenCalledWith(4);
    expect(searchIndexServiceMock.decrementCatalogProductLikesTotal).toHaveBeenCalledWith(2);
    expect(searchIndexServiceMock.decrementBusinessProductLikesTotal).toHaveBeenCalledWith(9);
  });

  it('ignores unknown job name', async () => {
    await expect(
      consumer.process({
        name: 'unknown_job',
        data: {},
      } as any),
    ).resolves.toBeUndefined();
  });
});
