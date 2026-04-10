import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CatalogVisitsGettersService } from './catalog-visits-getters.service';
import { Catalog, CatalogVisit } from '../../entities';

/**
 * Builds a chainable mock for TypeORM QueryBuilder used in catalog visit tests.
 * @param {number} countValue - Value returned by getCount.
 * @returns {object} Mock query builder.
 */
function createQueryBuilderMock(countValue: number) {
  const qb = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getQuery: jest.fn().mockReturnValue('(sub)'),
    getParameters: jest.fn().mockReturnValue({}),
    setParameters: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(countValue),
    getRawMany: jest.fn().mockResolvedValue([]),
  };
  return qb;
}

/**
 * Unit tests for {@link CatalogVisitsGettersService}.
 */
describe('CatalogVisitsGettersService', () => {
  const catalogVisitRepositoryMock = {
    createQueryBuilder: jest.fn(),
  };
  const catalogRepositoryMock = {
    createQueryBuilder: jest.fn(),
  };
  let service: CatalogVisitsGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogVisitsGettersService,
        {
          provide: getRepositoryToken(CatalogVisit),
          useValue: catalogVisitRepositoryMock,
        },
        {
          provide: getRepositoryToken(Catalog),
          useValue: catalogRepositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(CatalogVisitsGettersService);
  });

  describe('getCountByBusiness', () => {
    it('counts visits for non-deleted catalogs of the business', async () => {
      const qb = createQueryBuilderMock(11);
      catalogVisitRepositoryMock.createQueryBuilder.mockReturnValue(qb);
      const n = await service.getCountByBusiness(3);
      expect(n).toBe(11);
      expect(qb.innerJoin).toHaveBeenCalledWith('cv.catalog', 'c');
    });
    it('applies date range when period has both bounds', async () => {
      const qb = createQueryBuilderMock(2);
      catalogVisitRepositoryMock.createQueryBuilder.mockReturnValue(qb);
      await service.getCountByBusiness(1, {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
      expect(qb.andWhere).toHaveBeenCalled();
    });
  });

  describe('getGlobalVisitStatsForAdminStatistics', () => {
    it('counts all visits for non-deleted catalogs when no range is passed', async () => {
      const qb = createQueryBuilderMock(99);
      catalogVisitRepositoryMock.createQueryBuilder.mockReturnValue(qb);
      const result = await service.getGlobalVisitStatsForAdminStatistics();
      expect(result).toEqual({ total: 99 });
      expect(qb.innerJoin).toHaveBeenCalledWith('cv.catalog', 'c');
    });
    it('adds creation date filter when range is provided', async () => {
      const qb = createQueryBuilderMock(5);
      catalogVisitRepositoryMock.createQueryBuilder.mockReturnValue(qb);
      await service.getGlobalVisitStatsForAdminStatistics({
        startDate: '2024-06-01',
        endDate: '2024-06-07',
      });
      expect(qb.andWhere).toHaveBeenCalled();
    });
  });
});
