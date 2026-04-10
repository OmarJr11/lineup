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
  });
});
