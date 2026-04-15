import { SearchResolver } from './search.resolver';
import { SearchTargetEnum } from '../../../../core/common/enums';
import type { InfinityScrollInput } from '../../../../core/common/dtos';
import type { IUserReq } from '../../../../core/common/interfaces';
import type { SearchService } from '../../../../core/modules/search/search.service';
import type { UserSearchesService } from '../../../../core/modules/user-searches/user-searches.service';
import type { FeaturedCollectionsSchema } from '../../../../core/schemas/featured-collections.schema';

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
      const pagination = {
        page: 1,
        limit: 10,
        search: '   ',
      } as InfinityScrollInput;
      searchServiceMock.search.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      });
      await resolver.search(pagination, SearchTargetEnum.ALL, undefined, {
        userId: 1,
      } as IUserReq);
      expect(userSearchesServiceMock.recordSearch).not.toHaveBeenCalled();
    });
  });

  describe('getFeaturedResults', () => {
    it('returns all featured collections in one response', async () => {
      const pagination = { page: 1, limit: 5 } as InfinityScrollInput;
      const b = { id: 2 };
      const c = { id: 3 };
      const p = { id: 4 };
      const recent = { id: 5 };
      searchServiceMock.getFeaturedBusinesses.mockResolvedValue({
        items: [b],
        total: 1,
        page: 1,
        limit: 5,
      });
      searchServiceMock.getFeaturedCatalogs.mockResolvedValue({
        items: [c],
        total: 1,
        page: 1,
        limit: 5,
      });
      searchServiceMock.getFeaturedProducts.mockResolvedValue({
        items: [p],
        total: 1,
        page: 1,
        limit: 5,
      });
      searchServiceMock.getRecentlyAddedProducts.mockResolvedValue({
        items: [recent],
        total: 1,
        page: 1,
        limit: 5,
      });
      const out: FeaturedCollectionsSchema =
        await resolver.getFeaturedResults(pagination);
      expect(searchServiceMock.getFeaturedBusinesses).toHaveBeenCalledWith(
        pagination,
      );
      expect(searchServiceMock.getFeaturedCatalogs).toHaveBeenCalledWith(
        pagination,
      );
      expect(searchServiceMock.getFeaturedProducts).toHaveBeenCalledWith(
        pagination,
      );
      expect(searchServiceMock.getRecentlyAddedProducts).toHaveBeenCalledWith(
        pagination,
      );
      expect(out.featuredBusinesses).toEqual([b]);
      expect(out.featuredCatalogs).toEqual([c]);
      expect(out.featuredProducts).toEqual([{ ...p, price: null }]);
      expect(out.recentlyAddedProducts).toEqual([{ ...recent, price: null }]);
      expect(out.total).toBe(4);
      expect(out.page).toBe(1);
      expect(out.limit).toBe(5);
    });
  });
});
