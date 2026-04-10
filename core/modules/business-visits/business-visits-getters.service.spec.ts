import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessVisitsGettersService } from './business-visits-getters.service';
import { BusinessVisit } from '../../entities';

/**
 * Builds a chainable mock for TypeORM QueryBuilder used in tests.
 * @param {number} countValue - Value returned by getCount.
 * @returns {object} Mock query builder.
 */
function createQueryBuilderMock(countValue: number) {
  const qb = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(countValue),
  };
  return qb;
}

/**
 * Unit tests for {@link BusinessVisitsGettersService}.
 */
describe('BusinessVisitsGettersService', () => {
  const repositoryMock = {
    createQueryBuilder: jest.fn(),
  };
  let service: BusinessVisitsGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessVisitsGettersService,
        {
          provide: getRepositoryToken(BusinessVisit),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(BusinessVisitsGettersService);
  });

  describe('getGlobalVisitStatsForAdminStatistics', () => {
    it('returns total count without date filter when period is omitted', async () => {
      const qb = createQueryBuilderMock(42);
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      const result = await service.getGlobalVisitStatsForAdminStatistics();
      expect(result).toEqual({ total: 42 });
      expect(qb.andWhere).not.toHaveBeenCalled();
    });
    it('adds creation_date bounds when start and end are set', async () => {
      const qb = createQueryBuilderMock(3);
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await service.getGlobalVisitStatsForAdminStatistics({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
      expect(qb.andWhere).toHaveBeenCalled();
    });
  });

  describe('createBaseQueryBuilder', () => {
    it('scopes by business and optionally applies date range', async () => {
      const qb = createQueryBuilderMock(0);
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      service.createBaseQueryBuilder(5, {
        startDate: '2024-06-01',
        endDate: '2024-06-07',
      });
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith('bv');
      expect(qb.where).toHaveBeenCalledWith('bv.id_business = :idBusiness', {
        idBusiness: 5,
      });
      expect(qb.andWhere).toHaveBeenCalled();
    });
  });
});
