import { ProductRatingsResolver } from './product-ratings.resolver';
import { ProductRatingsService } from '../../../../core/modules/product-ratings/product-ratings.service';
import { ProductRatingsGettersService } from '../../../../core/modules/product-ratings/product-ratings-getters.service';
import type { RateProductInput } from '../../../../core/modules/product-ratings/dto/rate-product.input';
import type { InfinityScrollInput } from '../../../../core/common/dtos';
import type { IUserReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link ProductRatingsResolver}.
 */
describe('ProductRatingsResolver', () => {
  let resolver: ProductRatingsResolver;
  const productRatingsServiceMock = {
    rateProduct: jest.fn(),
  };
  const productRatingsGettersServiceMock = {
    findAllByProductPaginated: jest.fn(),
    findOneByProductAndUser: jest.fn(),
    findAllByUserPaginated: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new ProductRatingsResolver(
      productRatingsServiceMock as unknown as ProductRatingsService,
      productRatingsGettersServiceMock as unknown as ProductRatingsGettersService,
    );
  });

  it('rateProduct maps rating entity', async () => {
    const data = { idProduct: 1, stars: 5 } as RateProductInput;
    const user = { userId: 2 } as IUserReq;
    const rating = { id: 9 };
    productRatingsServiceMock.rateProduct.mockResolvedValue(rating);
    const out = await resolver.rateProduct(data, user);
    expect(productRatingsServiceMock.rateProduct).toHaveBeenCalledWith(
      data,
      user,
    );
    expect(out).toBe(rating);
  });

  it('productRatings returns paginated list', async () => {
    const pagination = { page: 1, limit: 10 } as InfinityScrollInput;
    const row = { id: 3 };
    productRatingsGettersServiceMock.findAllByProductPaginated.mockResolvedValue(
      [row],
    );
    const out = await resolver.productRatings(7, pagination);
    expect(out.items).toEqual([row]);
    expect(out.total).toBe(1);
  });

  it('myProductRating returns null when missing', async () => {
    const user = { userId: 1 } as IUserReq;
    productRatingsGettersServiceMock.findOneByProductAndUser.mockResolvedValue(
      null,
    );
    await expect(resolver.myProductRating(5, user)).resolves.toBeNull();
  });

  it('myProductRatings delegates to findAllByUserPaginated', async () => {
    const user = { userId: 4 } as IUserReq;
    const pagination = { page: 1, limit: 5 } as InfinityScrollInput;
    productRatingsGettersServiceMock.findAllByUserPaginated.mockResolvedValue([]);
    await resolver.myProductRatings(pagination, user);
    expect(
      productRatingsGettersServiceMock.findAllByUserPaginated,
    ).toHaveBeenCalledWith(4, pagination);
  });
});
