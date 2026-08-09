import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessFollowersGettersService } from './business-followers-getters.service';
import { BusinessFollower, Business } from '../../entities';

/**
 * Builds a chainable mock for TypeORM QueryBuilder.
 * @param {object} opts - getMany / getCount results.
 * @returns {object} Mock QB.
 */
function createQueryBuilderMock(opts: {
  getMany?: BusinessFollower[];
  getCount?: number;
}) {
  const qb = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(opts.getMany ?? []),
    getCount: jest.fn().mockResolvedValue(opts.getCount ?? 0),
  };
  return qb;
}

/**
 * Unit tests for {@link BusinessFollowersGettersService}.
 */
describe('BusinessFollowersGettersService', () => {
  const repositoryMock = {
    findOneOrFail: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  let service: BusinessFollowersGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessFollowersGettersService,
        {
          provide: getRepositoryToken(BusinessFollower),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(BusinessFollowersGettersService);
  });

  describe('findOne', () => {
    it('returns entity when repository resolves', async () => {
      const row = { id: 1 } as BusinessFollower;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findOne(1)).resolves.toBe(row);
    });
    it('maps repository failure to NotFoundException', async () => {
      repositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneByBusinessAndUser', () => {
    it('returns null when lookup throws', async () => {
      repositoryMock.findOne.mockRejectedValue(new Error('db'));
      await expect(service.findOneByBusinessAndUser(1, 2)).resolves.toBeNull();
    });
  });

  describe('findAllByBusiness', () => {
    it('throws NotFoundException when find fails', async () => {
      repositoryMock.find.mockRejectedValue(new Error('db'));
      await expect(service.findAllByBusiness(5)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllByUserPaginated', () => {
    it('maps followers to businesses and strips business password', async () => {
      const biz = { id: 10, password: 'x' } as Business;
      const follower = { business: biz } as BusinessFollower;
      const qb = createQueryBuilderMock({ getMany: [follower] });
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      const result = await service.findAllByUserPaginated(3, {
        page: 1,
        limit: 5,
      });
      expect(result).toHaveLength(1);
      expect(result[0].password).toBeUndefined();
      expect(qb.offset).toHaveBeenCalledWith(0);
    });
  });

  describe('countByBusiness', () => {
    it('returns 0 when getCount throws', async () => {
      const qb = createQueryBuilderMock({});
      qb.getCount.mockRejectedValue(new Error('db'));
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(service.countByBusiness(1)).resolves.toBe(0);
    });
  });

  describe('getCountForStatistics', () => {
    it('adds date range when both bounds are set', async () => {
      const qb = createQueryBuilderMock({ getCount: 4 });
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      const n = await service.getCountForStatistics(7, {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
      expect(n).toBe(4);
      expect(qb.andWhere).toHaveBeenCalled();
    });
  });

  describe('getTimeSeriesForStatistics', () => {
    it('counts within inclusive calendar bounds', async () => {
      const qb = createQueryBuilderMock({ getCount: 2 });
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      const n = await service.getTimeSeriesForStatistics(
        7,
        '2024-06-01',
        '2024-06-07',
      );
      expect(n).toBe(2);
      expect(qb.andWhere).toHaveBeenCalled();
    });
  });
});
