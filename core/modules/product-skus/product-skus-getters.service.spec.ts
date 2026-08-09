import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductSkusGettersService } from './product-skus-getters.service';
import { ProductSku } from '../../entities';

/**
 * Unit tests for {@link ProductSkusGettersService}.
 */
describe('ProductSkusGettersService', () => {
  const repositoryMock = {
    findOneOrFail: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  let service: ProductSkusGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductSkusGettersService,
        {
          provide: getRepositoryToken(ProductSku),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(ProductSkusGettersService);
  });

  describe('findOne', () => {
    it('returns sku when repository resolves', async () => {
      const row = { id: 1 } as ProductSku;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findOne(1)).resolves.toBe(row);
    });
    it('throws NotFoundException when findOneOrFail fails', async () => {
      repositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneWithRelations', () => {
    it('loads relations when found', async () => {
      const row = { id: 2 } as ProductSku;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findOneWithRelations(2)).resolves.toBe(row);
    });
  });

  describe('findOneByBusinessId', () => {
    it('returns sku scoped to business', async () => {
      const row = { id: 3, idCreationBusiness: 7 } as ProductSku;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findOneByBusinessId(3, 7)).resolves.toBe(row);
    });
  });

  describe('findAllByProduct', () => {
    it('returns rows from query builder', async () => {
      const rows = [{ id: 1 } as ProductSku];
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rows),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(service.findAllByProduct(10)).resolves.toBe(rows);
    });
  });

  describe('findAllByProductAndBusiness', () => {
    it('filters by product and business', async () => {
      const rows: ProductSku[] = [];
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rows),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(service.findAllByProductAndBusiness(1, 2)).resolves.toBe(
        rows,
      );
    });
  });

  describe('getTotalStockByProduct', () => {
    it('parses sum from raw query result', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '42' }),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(service.getTotalStockByProduct(5)).resolves.toBe(42);
    });
  });

  describe('getLowOrOutOfStockCountForStatistics', () => {
    it('returns count from query builder', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(3),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(
        service.getLowOrOutOfStockCountForStatistics(1, 5),
      ).resolves.toBe(3);
    });
  });

  describe('getActiveSkusForNonDeletedProductsCountForAdminStatistics', () => {
    it('returns join count', async () => {
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(100),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(
        service.getActiveSkusForNonDeletedProductsCountForAdminStatistics(),
      ).resolves.toBe(100);
    });
  });
});
