import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductVisitsGettersService } from './product-visits-getters.service';
import { ProductVisit } from '../../entities';

/**
 * Unit tests for {@link ProductVisitsGettersService}.
 */
describe('ProductVisitsGettersService', () => {
  const managerQb = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([
      { idProduct: 1, visits: '4' },
    ]),
  };
  const repositoryMock = {
    createQueryBuilder: jest.fn(),
    manager: {
      createQueryBuilder: jest.fn().mockReturnValue(managerQb),
    },
  };
  let service: ProductVisitsGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductVisitsGettersService,
        {
          provide: getRepositoryToken(ProductVisit),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(ProductVisitsGettersService);
  });

  describe('getTagIdsFromVisitedProducts', () => {
    it('returns unique tag ids up to limit', async () => {
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([{ idTag: '2' }, { idTag: '2' }, { idTag: '3' }]),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(service.getTagIdsFromVisitedProducts(7, 2)).resolves.toEqual([
        2, 3,
      ]);
    });
  });

  describe('getTopProductsByVisits', () => {
    it('maps subquery results to idProduct and visits', async () => {
      const subQb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getQuery: jest.fn().mockReturnValue('(sub)'),
        getParameters: jest.fn().mockReturnValue({ idBusiness: 1 }),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(subQb);
      managerQb.getRawMany.mockResolvedValue([
        { idProduct: 10, visits: '7' },
      ]);
      await expect(
        service.getTopProductsByVisits(1, undefined),
      ).resolves.toEqual([{ idProduct: 10, visits: 7 }]);
    });
  });

  describe('getVisitCountByProductIds', () => {
    it('returns 0 when productIds is empty', async () => {
      await expect(service.getVisitCountByProductIds([])).resolves.toBe(0);
      expect(repositoryMock.createQueryBuilder).not.toHaveBeenCalled();
    });
    it('parses count from raw result', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '12' }),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(service.getVisitCountByProductIds([1, 2])).resolves.toBe(12);
    });
  });

  describe('getGlobalVisitStatsForAdminStatistics', () => {
    it('returns total from getCount', async () => {
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(99),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(
        service.getGlobalVisitStatsForAdminStatistics(),
      ).resolves.toEqual({ total: 99 });
    });
  });
});
