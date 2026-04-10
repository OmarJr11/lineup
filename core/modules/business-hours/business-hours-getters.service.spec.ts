import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessHoursGettersService } from './business-hours-getters.service';
import { BusinessHour } from '../../entities';

/**
 * Unit tests for {@link BusinessHoursGettersService}.
 */
describe('BusinessHoursGettersService', () => {
  const repositoryMock = {
    findOneOrFail: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  let service: BusinessHoursGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessHoursGettersService,
        {
          provide: getRepositoryToken(BusinessHour),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(BusinessHoursGettersService);
  });

  describe('findOne', () => {
    it('returns slot when found', async () => {
      const row = { id: 1 } as BusinessHour;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findOne(1)).resolves.toBe(row);
    });
    it('throws NotFoundException when missing', async () => {
      repositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneByIdAndBusiness', () => {
    it('returns slot when id and business match', async () => {
      const row = { id: 3, idBusiness: 100 } as BusinessHour;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findOneByIdAndBusiness(3, 100)).resolves.toBe(row);
    });
    it('throws NotFoundException when missing', async () => {
      repositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(service.findOneByIdAndBusiness(1, 100)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllByBusiness', () => {
    it('orders by week day CASE, slot order, and open minute', async () => {
      const list: BusinessHour[] = [];
      const qb = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(list),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      const result = await service.findAllByBusiness(50);
      expect(result).toBe(list);
      expect(qb.orderBy).toHaveBeenCalledWith(
        expect.stringContaining('CASE'),
        'ASC',
      );
      expect(qb.addOrderBy).toHaveBeenCalledWith('bh.slotOrder', 'ASC');
      expect(qb.addOrderBy).toHaveBeenCalledWith('bh.opensAtMinute', 'ASC');
    });
  });
});
