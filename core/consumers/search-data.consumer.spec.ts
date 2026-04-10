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

  it('SearchDataProductRatingRecord updates average', async () => {
    const job = {
      name: SearchDataConsumerEnum.SearchDataProductRatingRecord,
      data: { idProduct: 2, ratingAverage: 4.5 },
    } as Job;
    await consumer.process(job);
    expect(
      searchIndexServiceMock.updateProductRatingAverage,
    ).toHaveBeenCalledWith(2, 4.5);
  });
});
