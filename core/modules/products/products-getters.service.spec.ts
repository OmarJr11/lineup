import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsGettersService } from './products-getters.service';
import type { Catalog } from '../../entities';
import { Product, ProductRating } from '../../entities';

/**
 * Unit tests for {@link ProductsGettersService}.
 */
describe('ProductsGettersService', () => {
  const productRepositoryMock = {
    findOneOrFail: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const productRatingRepositoryMock = {};
  let service: ProductsGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsGettersService,
        {
          provide: getRepositoryToken(Product),
          useValue: productRepositoryMock,
        },
        {
          provide: getRepositoryToken(ProductRating),
          useValue: productRatingRepositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(ProductsGettersService);
  });

  describe('findOne', () => {
    it('returns product when found', async () => {
      const row = { id: 1 } as Product;
      productRepositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findOne(1)).resolves.toBe(row);
    });
    it('throws NotFoundException when not found', async () => {
      productRepositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(service.findOne(0)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneByBusinessId', () => {
    it('returns product scoped to business', async () => {
      const row = { id: 2, idCreationBusiness: 5 } as Product;
      productRepositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findOneByBusinessId(2, 5)).resolves.toBe(row);
    });
  });

  describe('findManyWithRelations', () => {
    it('returns empty array when ids is empty', async () => {
      await expect(service.findManyWithRelations([])).resolves.toEqual([]);
    });
    it('uses repository.find when query builder returns no rows', async () => {
      const p = { id: 7 } as Product;
      const qb = {
        leftJoinAndSelect: jest.fn(),
        where: jest.fn(),
        andWhere: jest.fn(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      qb.leftJoinAndSelect.mockReturnValue(qb);
      qb.where.mockReturnValue(qb);
      qb.andWhere.mockReturnValue(qb);
      productRepositoryMock.createQueryBuilder.mockReturnValue(qb);
      productRepositoryMock.find.mockResolvedValue([p]);
      await expect(service.findManyWithRelations([7])).resolves.toEqual([p]);
      expect(productRepositoryMock.find).toHaveBeenCalled();
    });
  });

  describe('findOneWithRelations', () => {
    it('returns product when getOneOrFail succeeds', async () => {
      const row = { id: 3 } as Product;
      const qb = {
        leftJoinAndSelect: jest.fn(),
        where: jest.fn(),
        andWhere: jest.fn(),
        getOneOrFail: jest.fn().mockResolvedValue(row),
      };
      qb.leftJoinAndSelect.mockReturnValue(qb);
      qb.where.mockReturnValue(qb);
      qb.andWhere.mockReturnValue(qb);
      productRepositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(service.findOneWithRelations(3)).resolves.toBe(row);
    });
  });

  describe('findCatalogByProductId', () => {
    it('returns catalog from loaded product', async () => {
      const catalog = { id: 9, path: '/store/a' } as Catalog;
      const product = { id: 4, catalog } as Product;
      productRepositoryMock.findOneOrFail.mockResolvedValue(product);
      await expect(service.findCatalogByProductId(4)).resolves.toBe(catalog);
    });
    it('throws NotFoundException when product is missing', async () => {
      productRepositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(service.findCatalogByProductId(0)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findProductIdsByBusiness', () => {
    it('returns array of ids', async () => {
      const qb: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 10 }, { id: 20 }]),
      };
      productRepositoryMock.createQueryBuilder.mockReturnValue(qb);

      const ids = await service.findProductIdsByBusiness(5);
      expect(ids).toEqual([10, 20]);
    });
  });

  describe('findAllByBusinessAndIsPrimary', () => {
    it('returns matching products', async () => {
      const p = { id: 1 } as Product;
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([p]),
      };
      productRepositoryMock.createQueryBuilder.mockReturnValue(qb);

      const res = await service.findAllByBusinessAndIsPrimary(
        { idBusiness: 2, idCatalog: 3 },
        true,
      );
      expect(res).toEqual([p]);
    });
  });

  describe('getAllByCatalog', () => {
    it('returns products for catalog without search', async () => {
      const p = { id: 11 } as Product;
      const subQb: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getQuery: jest.fn().mockReturnValue('SELECT id FROM products'),
        getParameters: jest.fn().mockReturnValue({}),
      };
      const mainQb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([p]),
      };

      productRepositoryMock.createQueryBuilder
        .mockReturnValueOnce(subQb)
        .mockReturnValueOnce(mainQb);

      const res = await service.getAllByCatalog(1);
      expect(res).toEqual([p]);
    });
  });

  describe('statistics and aggregations', () => {
    it('getTotalLikesByProductIds returns 0 when array is empty', async () => {
      await expect(service.getTotalLikesByProductIds([])).resolves.toBe(0);
    });

    it('getTotalLikesByProductIds returns parsed sum from raw query', async () => {
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '125' }),
      };
      productRepositoryMock.createQueryBuilder.mockReturnValue(qb);

      await expect(service.getTotalLikesByProductIds([1, 2, 3])).resolves.toBe(
        125,
      );
    });

    it('getTopByVisitsForStatistics returns empty array when visitData is empty', async () => {
      const res = await service.getTopByVisitsForStatistics({
        idBusiness: 1,
        visitData: [],
      });
      expect(res).toEqual([]);
    });

    it('getTopByVisitsForStatistics sorts matching products by visits desc', async () => {
      productRepositoryMock.find.mockResolvedValue([
        { id: 1, title: 'Item 1' },
        { id: 2, title: 'Item 2' },
      ]);

      const res = await service.getTopByVisitsForStatistics({
        idBusiness: 1,
        visitData: [
          { idProduct: 1, visits: 10 },
          { idProduct: 2, visits: 50 },
        ],
      });

      expect(res).toHaveLength(2);
      expect(res[0].id).toBe(2);
      expect(res[0].visits).toBe(50);
      expect(res[1].id).toBe(1);
      expect(res[1].visits).toBe(10);
    });

    it('getTopByLikesForStatistics formats likes and returns top list', async () => {
      const qb: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([{ id: 1, title: 'Popular', likes: 99 }]),
      };
      productRepositoryMock.createQueryBuilder.mockReturnValue(qb);

      const res = await service.getTopByLikesForStatistics(1, 5);
      expect(res).toEqual([{ id: 1, title: 'Popular', likes: 99 }]);
    });

    it('getWithoutVisitsCountForStatistics delegates to query builder getCount', async () => {
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(7),
      };
      productRepositoryMock.createQueryBuilder.mockReturnValue(qb);

      await expect(service.getWithoutVisitsCountForStatistics(1)).resolves.toBe(
        7,
      );
    });

    it('getProductIdsAndLikesForStatistics calls repository find', async () => {
      productRepositoryMock.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const res = await service.getProductIdsAndLikesForStatistics(1);
      expect(res).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('getTopByRatingForStatistics formats rating average and returns top list', async () => {
      const qb: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([
            { id: 1, title: 'Top Rated', ratingAverage: 4.8 },
          ]),
      };
      productRepositoryMock.createQueryBuilder.mockReturnValue(qb);

      const res = await service.getTopByRatingForStatistics(1, 5);
      expect(res).toEqual([{ id: 1, title: 'Top Rated', ratingAverage: 4.8 }]);
    });

    it('findProductIdsByCatalog returns product IDs', async () => {
      const qb: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 10 }, { id: 20 }]),
      };
      productRepositoryMock.createQueryBuilder.mockReturnValue(qb);

      const res = await service.findProductIdsByCatalog(5);
      expect(res).toEqual([10, 20]);
    });

    it('findProductIdsByTagIds returns empty array when tagIds is empty', async () => {
      await expect(service.findProductIdsByTagIds([], 10)).resolves.toEqual([]);
    });

    it('findProductIdsByTagIds returns mapped numeric IDs', async () => {
      const qb: any = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ id: '1' }, { id: '2' }]),
      };
      productRepositoryMock.createQueryBuilder.mockReturnValue(qb);

      const res = await service.findProductIdsByTagIds([1, 2], 5);
      expect(res).toEqual([1, 2]);
    });
  });

  describe('findAllByTag and findAllByTags', () => {
    it('findAllByTags returns empty array when tagNamesOrSlugs is empty', async () => {
      await expect(service.findAllByTags([], {})).resolves.toEqual([]);
    });

    it('findAllByTag executes subQuery and mainQuery', async () => {
      const p = { id: 1 } as Product;
      const subQb: any = {
        select: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getQuery: jest.fn().mockReturnValue('SELECT id FROM sub'),
        getParameters: jest.fn().mockReturnValue({}),
      };
      const mainQb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([p]),
      };

      productRepositoryMock.createQueryBuilder
        .mockReturnValueOnce(subQb)
        .mockReturnValueOnce(mainQb);

      const res = await service.findAllByTag('promo', {}, 1, [99]);
      expect(res).toEqual([p]);
    });

    it('findAllByTags executes subQuery and mainQuery', async () => {
      const p = { id: 2 } as Product;
      const subQb: any = {
        select: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getQuery: jest.fn().mockReturnValue('SELECT id FROM sub'),
        getParameters: jest.fn().mockReturnValue({}),
      };
      const mainQb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([p]),
      };

      productRepositoryMock.createQueryBuilder
        .mockReturnValueOnce(subQb)
        .mockReturnValueOnce(mainQb);

      const res = await service.findAllByTags(['promo', 'sale'], {}, 1, [99]);
      expect(res).toEqual([p]);
    });
  });

  describe('getAllByCatalogPaginated and findAllByBusiness', () => {
    it('getAllByCatalogPaginated applies search and returns products', async () => {
      const p = { id: 5 } as Product;
      const subQb: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getQuery: jest.fn().mockReturnValue('SELECT id FROM sub'),
        getParameters: jest.fn().mockReturnValue({}),
      };
      const mainQb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([p]),
      };

      productRepositoryMock.createQueryBuilder
        .mockReturnValueOnce(subQb)
        .mockReturnValueOnce(mainQb);

      const res = await service.getAllByCatalogPaginated(1, { search: 'test' });
      expect(res).toEqual([p]);
    });

    it('findAllByBusiness applies onlyDraft and search and returns products', async () => {
      const p = { id: 6 } as Product;
      const subQb: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getQuery: jest.fn().mockReturnValue('SELECT id FROM sub'),
        getParameters: jest.fn().mockReturnValue({}),
      };
      const mainQb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([p]),
      };

      productRepositoryMock.createQueryBuilder
        .mockReturnValueOnce(subQb)
        .mockReturnValueOnce(mainQb);

      const res = await service.findAllByBusiness(1, { search: 'draft' }, true);
      expect(res).toEqual([p]);
    });
  });

  describe('low stock and admin statistics', () => {
    it('getWithoutRatingsCountForStatistics executes subQb and mainQb getCount', async () => {
      const subQb: any = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getQuery: jest.fn().mockReturnValue('SELECT id FROM pr'),
        getParameters: jest.fn().mockReturnValue({}),
      };
      (service as any).productRatingRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(subQb),
      };

      const mainQb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(4),
      };
      productRepositoryMock.createQueryBuilder.mockReturnValue(mainQb);

      const res = await service.getWithoutRatingsCountForStatistics(1);
      expect(res).toBe(4);
    });

    it('getWithoutStockCountForStatistics counts products with 0 SKUs or null quantities', async () => {
      const qb: any = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { id: 1, skuCount: '0', nullCount: '0' },
          { id: 2, skuCount: '2', nullCount: '2' },
          { id: 3, skuCount: '3', nullCount: '1' },
        ]),
      };
      productRepositoryMock.createQueryBuilder.mockReturnValue(qb);

      const res = await service.getWithoutStockCountForStatistics(1);
      expect(res).toBe(2);
    });

    it('getNonDeletedProductsCountForAdminStatistics calls repository count', async () => {
      productRepositoryMock.count = jest.fn().mockResolvedValue(15);
      await expect(
        service.getNonDeletedProductsCountForAdminStatistics(),
      ).resolves.toBe(15);
    });

    it('getGlobalProductsWithoutStockCountForAdminStatistics calculates count globally', async () => {
      const qb: any = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { id: 1, skuCount: '0', nullCount: '0' },
          { id: 2, skuCount: '1', nullCount: '1' },
          { id: 3, skuCount: '2', nullCount: '0' },
        ]),
      };
      productRepositoryMock.createQueryBuilder.mockReturnValue(qb);

      const res =
        await service.getGlobalProductsWithoutStockCountForAdminStatistics();
      expect(res).toBe(2);
    });

    it('resetStockNotifiedForRestockedProducts executes query on repository', async () => {
      productRepositoryMock.query = jest.fn().mockResolvedValue(undefined);
      await expect(
        service.resetStockNotifiedForRestockedProducts(),
      ).resolves.toBeUndefined();
      expect(productRepositoryMock.query).toHaveBeenCalled();
    });

    it('findProductIdsWithLowStockPendingNotification returns mapped ids', async () => {
      const qb: any = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ id: '10' }, { id: '20' }]),
      };
      productRepositoryMock.createQueryBuilder.mockReturnValue(qb);

      const res = await service.findProductIdsWithLowStockPendingNotification();
      expect(res).toEqual([10, 20]);
    });

    it('findOneActiveSummaryForLowStockJob returns summary or null', async () => {
      jest.spyOn(service, 'findOneWithOptions').mockResolvedValueOnce(null);
      await expect(
        service.findOneActiveSummaryForLowStockJob(1),
      ).resolves.toBeNull();

      jest.spyOn(service, 'findOneWithOptions').mockResolvedValueOnce({
        id: 2,
        title: 'Low stock item',
        idCreationBusiness: 5,
      } as any);
      await expect(
        service.findOneActiveSummaryForLowStockJob(2),
      ).resolves.toEqual({
        id: 2,
        title: 'Low stock item',
        idCreationBusiness: 5,
      });
    });
  });
});
