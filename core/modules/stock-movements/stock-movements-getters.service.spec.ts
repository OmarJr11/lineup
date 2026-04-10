import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StockMovementsGettersService } from './stock-movements-getters.service';
import { StockMovement } from '../../entities';
import { StockMovementTypeEnum } from '../../common/enums/stock-movement-type.enum';

/**
 * Unit tests for {@link StockMovementsGettersService}.
 */
describe('StockMovementsGettersService', () => {
  const repositoryMock = {
    findOneOrFail: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  let service: StockMovementsGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        StockMovementsGettersService,
        {
          provide: getRepositoryToken(StockMovement),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(StockMovementsGettersService);
  });

  describe('findOne', () => {
    it('returns row when found', async () => {
      const row = { id: 1 } as StockMovement;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findOne(1)).resolves.toBe(row);
    });
    it('throws NotFoundException when missing', async () => {
      repositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(service.findOne(9)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByProductSku', () => {
    it('returns rows from query builder', async () => {
      const rows = [{ id: 2 } as StockMovement];
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rows),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(service.findAllByProductSku(10, 20)).resolves.toBe(rows);
      expect(qb.limit).toHaveBeenCalledWith(20);
    });
  });

  describe('findAllByBusiness', () => {
    it('applies limit and offset', async () => {
      const rows: StockMovement[] = [];
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rows),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(service.findAllByBusiness(3, 15, 30)).resolves.toBe(rows);
      expect(qb.limit).toHaveBeenCalledWith(15);
      expect(qb.offset).toHaveBeenCalledWith(30);
    });
  });

  describe('countByBusiness', () => {
    it('returns count from query builder', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(42),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(service.countByBusiness(5)).resolves.toBe(42);
    });
  });

  describe('getRecentForStatistics', () => {
    it('maps movements to stat items', async () => {
      const sm = {
        id: 1,
        type: StockMovementTypeEnum.SALE,
        quantityDelta: -1,
        creationDate: new Date('2026-01-01'),
        price: 10,
      } as StockMovement;
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([sm]),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      const result = await service.getRecentForStatistics(7, 5);
      expect(result).toEqual([
        {
          id: 1,
          type: StockMovementTypeEnum.SALE,
          quantityDelta: -1,
          creationDate: sm.creationDate,
          price: 10,
        },
      ]);
    });
  });

  describe('getSalesCountForStatistics', () => {
    it('returns total sale count in optional period', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(100),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(
        service.getSalesCountForStatistics(4, {
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-01-31T23:59:59.999Z',
        }),
      ).resolves.toEqual({ total: 100 });
    });
  });
});
