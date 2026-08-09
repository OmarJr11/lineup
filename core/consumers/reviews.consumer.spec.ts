import { Job, Queue } from 'bullmq';
import { ReviewsConsumer } from './reviews.consumer';
import { ProductRatingsGettersService } from '../modules/product-ratings/product-ratings-getters.service';
import { ProductsGettersService } from '../modules/products/products-getters.service';
import { ProductsSettersService } from '../modules/products/products-setters.service';
import { ReviewsConsumerEnum } from '../common/enums/consumers';
import { SearchDataConsumerEnum } from '../common/enums/consumers';
import type { IUserReq } from '../common/interfaces';

/**
 * Unit tests for {@link ReviewsConsumer}.
 */
describe('ReviewsConsumer', () => {
  let consumer: ReviewsConsumer;
  const productRatingsGettersServiceMock = {
    findAllByProduct: jest.fn(),
  };
  const productsGettersServiceMock = {
    findOne: jest.fn(),
  };
  const productsSettersServiceMock = {
    updateRatingAverage: jest.fn(),
  };
  const searchDataQueueMock = {
    add: jest.fn(),
  };

  const user = { userId: 1, username: 'u' } as IUserReq;

  beforeEach(() => {
    jest.clearAllMocks();
    consumer = new ReviewsConsumer(
      productRatingsGettersServiceMock as unknown as ProductRatingsGettersService,
      productsGettersServiceMock as unknown as ProductsGettersService,
      productsSettersServiceMock as unknown as ProductsSettersService,
      searchDataQueueMock as unknown as Queue,
    );
  });

  it('returns early when idProduct is missing', async () => {
    const job = {
      id: '1',
      name: ReviewsConsumerEnum.CalculateAverage,
      data: { user },
    } as Job;
    await consumer.process(job);
    expect(productRatingsGettersServiceMock.findAllByProduct).not.toHaveBeenCalled();
  });

  it('computes average, updates product, and enqueues search index job', async () => {
    const product = { id: 5 };
    productRatingsGettersServiceMock.findAllByProduct.mockResolvedValue([
      { stars: 4 },
      { stars: 2 },
    ]);
    productsGettersServiceMock.findOne.mockResolvedValue(product);
    const job = {
      id: '2',
      name: ReviewsConsumerEnum.CalculateAverage,
      data: { idProduct: 5, user },
    } as Job;
    await consumer.process(job);
    expect(productsSettersServiceMock.updateRatingAverage).toHaveBeenCalledWith(
      product,
      3,
      user,
    );
    expect(searchDataQueueMock.add).toHaveBeenCalledWith(
      SearchDataConsumerEnum.SearchDataProductRatingRecord,
      { idProduct: 5, ratingAverage: 3 },
    );
  });
});
