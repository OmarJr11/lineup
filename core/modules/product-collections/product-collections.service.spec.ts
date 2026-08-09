import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { Product } from '../../entities';
import { SearchTargetEnum } from '../../common/enums';
import { ProductCollectionsService } from './product-collections.service';
import { ProductsGettersService } from '../products/products-getters.service';
import { ProductSearchIndexGettersService } from '../search/product-search-index-getters.service';
import { SearchService } from '../search/search.service';
import { UserSearchesService } from '../user-searches/user-searches.service';
import { UsersGettersService } from '../users/users.getters.service';
import { ProductVisitsGettersService } from '../product-visits/product-visits-getters.service';
import { ProductReactionsGettersService } from '../product-reactions/product-reactions-getters.service';

/**
 * Unit tests for {@link ProductCollectionsService}.
 */
describe('ProductCollectionsService', () => {
  const productsGettersServiceMock = {
    findProductIdsByTagIds: jest.fn(),
    findManyWithRelations: jest.fn(),
  };
  const productSearchIndexGettersServiceMock = {
    getProductIdsByLocation: jest.fn(),
    getTopRatedProductIds: jest.fn(),
    getMostVisitedProductIds: jest.fn(),
  };
  const searchServiceMock = {
    search: jest.fn(),
  };
  const userSearchesServiceMock = {
    getRecentSearchTerms: jest.fn(),
  };
  const usersGettersServiceMock = {
    findOne: jest.fn(),
  };
  const productVisitsGettersServiceMock = {
    getTagIdsFromVisitedProducts: jest.fn(),
  };
  const productReactionsGettersServiceMock = {
    getTagIdsFromLikedProducts: jest.fn(),
  };
  let service: ProductCollectionsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductCollectionsService,
        {
          provide: ProductsGettersService,
          useValue: productsGettersServiceMock,
        },
        {
          provide: ProductSearchIndexGettersService,
          useValue: productSearchIndexGettersServiceMock,
        },
        { provide: SearchService, useValue: searchServiceMock },
        {
          provide: UserSearchesService,
          useValue: userSearchesServiceMock,
        },
        {
          provide: UsersGettersService,
          useValue: usersGettersServiceMock,
        },
        {
          provide: ProductVisitsGettersService,
          useValue: productVisitsGettersServiceMock,
        },
        {
          provide: ProductReactionsGettersService,
          useValue: productReactionsGettersServiceMock,
        },
      ],
    }).compile();
    service = moduleRef.get(ProductCollectionsService);
  });

  describe('getCollections', () => {
    it('returns fallback collections when user id is null', async () => {
      const topIds = [1, 2];
      const visitIds = [3, 4];
      const topProducts = [{ id: 1 }, { id: 2 }] as Product[];
      const visitProducts = [{ id: 3 }, { id: 4 }] as Product[];
      productSearchIndexGettersServiceMock.getTopRatedProductIds.mockResolvedValue(
        topIds,
      );
      productSearchIndexGettersServiceMock.getMostVisitedProductIds.mockResolvedValue(
        visitIds,
      );
      productsGettersServiceMock.findManyWithRelations
        .mockResolvedValueOnce(topProducts)
        .mockResolvedValueOnce(visitProducts);
      const result = await service.getCollections(null);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('top-rated');
      expect(result[0].products.map((p) => p.id)).toEqual([1, 2]);
      expect(result[1].id).toBe('most-visited');
      expect(result[1].products.map((p) => p.id)).toEqual([3, 4]);
    });

    it('returns fallback when logged-in user has no personalized data', async () => {
      productVisitsGettersServiceMock.getTagIdsFromVisitedProducts.mockResolvedValue(
        [],
      );
      productReactionsGettersServiceMock.getTagIdsFromLikedProducts.mockResolvedValue(
        [],
      );
      usersGettersServiceMock.findOne.mockResolvedValue({ state: null });
      userSearchesServiceMock.getRecentSearchTerms.mockResolvedValue([]);
      const topIds = [10];
      const visitIds = [20];
      productSearchIndexGettersServiceMock.getTopRatedProductIds.mockResolvedValue(
        topIds,
      );
      productSearchIndexGettersServiceMock.getMostVisitedProductIds.mockResolvedValue(
        visitIds,
      );
      const p1 = [{ id: 10 }] as Product[];
      const p2 = [{ id: 20 }] as Product[];
      productsGettersServiceMock.findManyWithRelations
        .mockResolvedValueOnce(p1)
        .mockResolvedValueOnce(p2);
      const result = await service.getCollections(1);
      expect(result[0].id).toBe('top-rated');
      expect(result[1].id).toBe('most-visited');
    });

    it('includes visited-tags collection when user has visited product tags', async () => {
      productVisitsGettersServiceMock.getTagIdsFromVisitedProducts.mockResolvedValue(
        [7],
      );
      productsGettersServiceMock.findProductIdsByTagIds.mockResolvedValue([100]);
      const loaded = [{ id: 100 }] as Product[];
      productsGettersServiceMock.findManyWithRelations.mockResolvedValue(loaded);
      productReactionsGettersServiceMock.getTagIdsFromLikedProducts.mockResolvedValue(
        [],
      );
      usersGettersServiceMock.findOne.mockResolvedValue({ state: null });
      userSearchesServiceMock.getRecentSearchTerms.mockResolvedValue([]);
      const result = await service.getCollections(5);
      expect(result.some((c) => c.id === 'visited-tags')).toBe(true);
      expect(
        result.find((c) => c.id === 'visited-tags')?.products,
      ).toEqual(loaded);
    });

    it('includes searches-based collection when user has search terms', async () => {
      productVisitsGettersServiceMock.getTagIdsFromVisitedProducts.mockResolvedValue(
        [],
      );
      productReactionsGettersServiceMock.getTagIdsFromLikedProducts.mockResolvedValue(
        [],
      );
      usersGettersServiceMock.findOne.mockResolvedValue({ state: null });
      userSearchesServiceMock.getRecentSearchTerms.mockResolvedValue(['shoes']);
      const productEntity = { id: 55 } as Product;
      searchServiceMock.search.mockResolvedValue({
        items: [
          {
            __typename: 'ProductSchema',
            item: productEntity,
          },
        ],
      });
      const loaded = [productEntity] as Product[];
      productsGettersServiceMock.findManyWithRelations.mockResolvedValue(loaded);
      const result = await service.getCollections(2);
      const searches = result.find((c) => c.id === 'searches');
      expect(searches?.title).toBe('Basado en tus búsquedas');
      expect(searches?.products).toEqual(loaded);
      expect(searchServiceMock.search).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 5,
          search: 'shoes',
        }),
        SearchTargetEnum.PRODUCTS,
      );
    });
  });
});
