import { WishlistsResolver } from './wishlists.resolver';
import { BusinessFollowersGettersService } from '../../../../core/modules/business-followers/business-followers-getters.service';
import { ProductReactionsGettersService } from '../../../../core/modules/product-reactions/product-reactions-getters.service';
import type { InfinityScrollInput } from '../../../../core/common/dtos';
import type { IUserReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link WishlistsResolver}.
 */
describe('WishlistsResolver', () => {
  let resolver: WishlistsResolver;
  const businessFollowersGettersServiceMock = {
    findAllByUserPaginated: jest.fn(),
  };
  const productReactionsGettersServiceMock = {
    findAllLikedByUserPaginated: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new WishlistsResolver(
      businessFollowersGettersServiceMock as unknown as BusinessFollowersGettersService,
      productReactionsGettersServiceMock as unknown as ProductReactionsGettersService,
    );
  });

  it('findFollowedBusinesses paginates and maps', async () => {
    const user = { userId: 2 } as IUserReq;
    const pagination = { page: 1, limit: 10 } as InfinityScrollInput;
    const b = { id: 1 };
    businessFollowersGettersServiceMock.findAllByUserPaginated.mockResolvedValue(
      [b],
    );
    const out = await resolver.findFollowedBusinesses(user, pagination);
    expect(
      businessFollowersGettersServiceMock.findAllByUserPaginated,
    ).toHaveBeenCalledWith(2, pagination);
    expect(out.items).toEqual([b]);
    expect(out.limit).toBe(10);
  });

  it('findLikedProducts maps products with price from toProductSchema', async () => {
    const user = { userId: 2 } as IUserReq;
    const pagination = { page: 1 } as InfinityScrollInput;
    const p = { id: 9 };
    productReactionsGettersServiceMock.findAllLikedByUserPaginated.mockResolvedValue(
      [p],
    );
    const out = await resolver.findLikedProducts(user, pagination);
    expect(out.items).toEqual([{ ...p, price: null }]);
    expect(out.limit).toBe(10);
  });
});
