import { SearchResolver } from './search.resolver';
import { SearchService } from '../../../../core/modules/search/search.service';
import { UserSearchesService } from '../../../../core/modules/user-searches/user-searches.service';
import { SearchTargetEnum } from '../../../../core/common/enums';
import type { InfinityScrollInput } from '../../../../core/common/dtos';
import type { IUserReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link SearchResolver}.
 */
describe('SearchResolver', () => {
  let resolver: SearchResolver;
  const searchServiceMock = {
    search: jest.fn(),
    getFeaturedBusinesses: jest.fn(),
    getFeaturedCatalogs: jest.fn(),
    getFeaturedProducts: jest.fn(),
    getRecentlyAddedProducts: jest.fn(),
  };
  const userSearchesServiceMock = {
    recordSearch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new SearchResolver(
      searchServiceMock as unknown as SearchService,
      userSearchesServiceMock as unknown as UserSearchesService,
    );
  });

  describe('search', () => {
    it('maps business items and records search for logged-in user', async () => {
      const pagination = {
        page: 1,
        limit: 10,
        search: '  cafe  ',
      } as InfinityScrollInput;
      const business = { id: 1, name: 'Cafe' };
      searchServiceMock.search.mockResolvedValue({
        items: [{ item: business, __typename: 'BusinessSchema' }],
        total: 1,
        page: 1,
        limit: 10,
      });
      const user = { userId: 5 } as IUserReq;
      const out = await resolver.search(
        pagination,
        SearchTargetEnum.BUSINESSES,
        undefined,
        user,
      );
      expect(searchServiceMock.search).toHaveBeenCalledWith(
        pagination,
        SearchTargetEnum.BUSINESSES,
        undefined,
      );
      expect(userSearchesServiceMock.recordSearch).toHaveBeenCalledWith(
        'cafe',
        user,
      );
      expect(out.items[0]).toEqual({
        ...business,
        __typename: 'BusinessSchema',
      });
      expect(out.total).toBe(1);
    });

    it('does not record search when term is empty', async () => {
      const pagination = { page: 1, limit: 10, search: '   ' } as InfinityScrollInput;
      searchServiceMock.search.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      });
      await resolver.search(
        pagination,
        SearchTargetEnum.ALL,
        undefined,
        { userId: 1 } as IUserReq,
      );
      expect(userSearchesServiceMock.recordSearch).not.toHaveBeenCalled();
    });
  });

  describe('featuredBusinesses', () => {
    it('delegates to search service and maps items', async () => {
      const pagination = { page: 1, limit: 5 } as InfinityScrollInput;
      const b = { id: 2 };
      searchServiceMock.getFeaturedBusinesses.mockResolvedValue({
        items: [b],
        total: 1,
        page: 1,
        limit: 5,
      });
      const out = await resolver.featuredBusinesses(pagination);
      expect(out.items).toEqual([b]);
      expect(out.total).toBe(1);
    });
  });

  describe('recentlyAddedProducts', () => {
    it('maps products with price field from toProductSchema', async () => {
      const pagination = { page: 1, limit: 10 } as InfinityScrollInput;
      const product = { id: 9 };
      searchServiceMock.getRecentlyAddedProducts.mockResolvedValue({
        items: [product],
        total: 1,
        page: 1,
        limit: 10,
      });
      const out = await resolver.recentlyAddedProducts(pagination);
      expect(out.items).toEqual([{ ...product, price: null }]);
    });
  });
});
