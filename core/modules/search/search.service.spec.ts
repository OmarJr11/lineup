import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { SearchService } from './search.service';
import { BusinessesGettersService } from '../businesses/businesses-getters.service';
import { CatalogsGettersService } from '../catalogs/catalogs-getters.service';
import { ProductsGettersService } from '../products/products-getters.service';
import { SearchTargetEnum } from '../../common/enums';
import type { Product } from '../../entities';

/**
 * Unit tests for {@link SearchService}.
 */
describe('SearchService', () => {
  const dataSourceMock = {
    query: jest.fn(),
  };
  const businessesGettersServiceMock = {
    findByIds: jest.fn(),
  };
  const catalogsGettersServiceMock = {
    findByIds: jest.fn(),
  };
  const productsGettersServiceMock = {
    findManyWithRelations: jest.fn(),
  };
  let service: SearchService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: DataSource, useValue: dataSourceMock },
        {
          provide: BusinessesGettersService,
          useValue: businessesGettersServiceMock,
        },
        {
          provide: CatalogsGettersService,
          useValue: catalogsGettersServiceMock,
        },
        {
          provide: ProductsGettersService,
          useValue: productsGettersServiceMock,
        },
      ],
    }).compile();
    service = moduleRef.get(SearchService);
  });

  describe('search', () => {
    it('returns random product results when search term is empty', async () => {
      dataSourceMock.query
        .mockResolvedValueOnce([{ id: 1, type: 'product', rank: 0 }])
        .mockResolvedValueOnce([{ total: 1 }]);
      const product = { id: 1, title: 'P' } as Product;
      productsGettersServiceMock.findManyWithRelations.mockResolvedValue([
        product,
      ]);
      const result = await service.search(
        { page: 1, limit: 10, search: '   ' },
        SearchTargetEnum.PRODUCTS,
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].__typename).toBe('ProductSchema');
      expect(result.total).toBe(1);
    });
    it('returns empty result when query throws', async () => {
      dataSourceMock.query.mockRejectedValue(new Error('db'));
      const result = await service.search(
        { page: 1, limit: 10, search: 'phones' },
        SearchTargetEnum.PRODUCTS,
      );
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getFeaturedBusinesses', () => {
    it('maps ids to businesses in order', async () => {
      dataSourceMock.query
        .mockResolvedValueOnce([{ id: 10 }, { id: 11 }])
        .mockResolvedValueOnce([{ total: 2 }]);
      const b1 = { id: 10, name: 'A' } as never;
      const b2 = { id: 11, name: 'B' } as never;
      businessesGettersServiceMock.findByIds.mockResolvedValue([b1, b2]);
      const result = await service.getFeaturedBusinesses({
        page: 1,
        limit: 10,
      });
      expect(result.items.map((b) => b.id)).toEqual([10, 11]);
      expect(result.total).toBe(2);
    });

    it('returns empty result on query failure', async () => {
      dataSourceMock.query.mockRejectedValue(new Error('fail'));
      const result = await service.getFeaturedBusinesses({
        page: 1,
        limit: 10,
      });
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getFeaturedCatalogs', () => {
    it('returns featured catalogs in rank order', async () => {
      dataSourceMock.query
        .mockResolvedValueOnce([{ id: 5 }])
        .mockResolvedValueOnce([{ total: 1 }]);
      const cat = { id: 5, name: 'Cat 1' } as never;
      catalogsGettersServiceMock.findByIds.mockResolvedValue([cat]);

      const result = await service.getFeaturedCatalogs({ page: 1, limit: 10 });
      expect(result.items).toEqual([cat]);
      expect(result.total).toBe(1);
    });

    it('returns empty result on error', async () => {
      dataSourceMock.query.mockRejectedValue(new Error('fail'));
      const result = await service.getFeaturedCatalogs({ page: 1, limit: 10 });
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getFeaturedProducts', () => {
    it('returns featured products in rank order', async () => {
      dataSourceMock.query
        .mockResolvedValueOnce([{ id: 8 }])
        .mockResolvedValueOnce([{ total: 1 }]);
      const prod = { id: 8, title: 'Prod 1' } as never;
      productsGettersServiceMock.findManyWithRelations.mockResolvedValue([
        prod,
      ]);

      const result = await service.getFeaturedProducts({ page: 1, limit: 10 });
      expect(result.items).toEqual([prod]);
      expect(result.total).toBe(1);
    });

    it('returns empty result on error', async () => {
      dataSourceMock.query.mockRejectedValue(new Error('fail'));
      const result = await service.getFeaturedProducts({ page: 1, limit: 10 });
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('search across different targets and filters', () => {
    it('searches businesses target with keyword', async () => {
      dataSourceMock.query
        .mockResolvedValueOnce([{ id: 2, type: 'business', rank: 0.9 }])
        .mockResolvedValueOnce([{ total: 1 }]);
      const b = { id: 2, name: 'Shop' } as never;
      businessesGettersServiceMock.findByIds.mockResolvedValue([b]);

      const result = await service.search(
        { page: 1, limit: 10, search: 'shop' },
        SearchTargetEnum.BUSINESSES,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].__typename).toBe('BusinessSchema');
    });

    it('searches catalogs target with keyword', async () => {
      dataSourceMock.query
        .mockResolvedValueOnce([{ id: 3, type: 'catalog', rank: 0.8 }])
        .mockResolvedValueOnce([{ total: 1 }]);
      const c = { id: 3, name: 'Menu' } as never;
      catalogsGettersServiceMock.findByIds.mockResolvedValue([c]);

      const result = await service.search(
        { page: 1, limit: 10, search: 'menu' },
        SearchTargetEnum.CATALOGS,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].__typename).toBe('CatalogSchema');
    });

    it('searches with product filters and forces PRODUCTS target', async () => {
      dataSourceMock.query
        .mockResolvedValueOnce([{ id: 4, type: 'product', rank: 0.95 }])
        .mockResolvedValueOnce([{ total: 1 }]);
      const p = { id: 4, title: 'Cheap Phone' } as never;
      productsGettersServiceMock.findManyWithRelations.mockResolvedValue([p]);

      const result = await service.search(
        { page: 1, limit: 10, search: 'phone' },
        SearchTargetEnum.ALL,
        { minPrice: 10, maxPrice: 100, minRating: 4 },
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].__typename).toBe('ProductSchema');
    });
  });
});
