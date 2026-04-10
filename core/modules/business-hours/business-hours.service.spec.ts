jest.mock('typeorm-transactional-cls-hooked', () => {
  const actual =
    jest.requireActual<typeof import('typeorm-transactional-cls-hooked')>(
      'typeorm-transactional-cls-hooked',
    );
  return {
    ...actual,
    Transactional:
      () =>
      (
        _target: object,
        _propertyKey: string | symbol,
        descriptor: PropertyDescriptor,
      ): PropertyDescriptor =>
        descriptor,
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessHoursService } from './business-hours.service';
import { BusinessHoursGettersService } from './business-hours-getters.service';
import { BusinessHoursSettersService } from './business-hours-setters.service';
import { BusinessHour } from '../../entities';
import { WeekDayEnum } from '../../common/enums/week-day.enum';

/**
 * Unit tests for {@link BusinessHoursService}.
 */
describe('BusinessHoursService', () => {
  const businessHoursGettersServiceMock = {
    findAllByBusiness: jest.fn(),
    findOneByIdAndBusiness: jest.fn(),
  };
  const businessHoursSettersServiceMock = {
    createMany: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  let service: BusinessHoursService;
  const businessReq = { businessId: 100, path: '/businesses' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessHoursService,
        { provide: REQUEST, useValue: {} },
        {
          provide: getRepositoryToken(BusinessHour),
          useValue: {},
        },
        {
          provide: BusinessHoursGettersService,
          useValue: businessHoursGettersServiceMock,
        },
        {
          provide: BusinessHoursSettersService,
          useValue: businessHoursSettersServiceMock,
        },
      ],
    }).compile();
    service = await moduleRef.resolve(BusinessHoursService);
  });

  describe('create', () => {
    it('delegates to setters then returns ordered schedule from getters', async () => {
      const slots = [
        {
          dayOfWeek: WeekDayEnum.MONDAY,
          opensAtMinute: 540,
          closesAtMinute: 1020,
          slotOrder: 1,
        },
      ];
      const ordered = [{ id: 1 } as BusinessHour];
      businessHoursSettersServiceMock.createMany.mockResolvedValue([]);
      businessHoursGettersServiceMock.findAllByBusiness.mockResolvedValue(ordered);
      const result = await service.create({ slots }, businessReq);
      expect(businessHoursSettersServiceMock.createMany).toHaveBeenCalledWith(
        slots,
        businessReq,
      );
      expect(businessHoursGettersServiceMock.findAllByBusiness).toHaveBeenCalledWith(
        100,
      );
      expect(result).toBe(ordered);
    });
  });

  describe('update', () => {
    it('loads slot, updates, returns refreshed row', async () => {
      const row = { id: 5, idBusiness: 100 } as BusinessHour;
      const updatedRow = { id: 5, opensAtMinute: 600 } as BusinessHour;
      businessHoursGettersServiceMock.findOneByIdAndBusiness
        .mockResolvedValueOnce(row)
        .mockResolvedValueOnce(updatedRow);
      const data = { id: 5, opensAtMinute: 600, closesAtMinute: 1020 };
      const result = await service.update(data, businessReq);
      expect(businessHoursSettersServiceMock.update).toHaveBeenCalledWith(
        row,
        data,
        businessReq,
      );
      expect(result).toBe(updatedRow);
    });
  });

  describe('remove', () => {
    it('loads slot by business scope then removes', async () => {
      const row = { id: 8 } as BusinessHour;
      businessHoursGettersServiceMock.findOneByIdAndBusiness.mockResolvedValue(row);
      businessHoursSettersServiceMock.remove.mockResolvedValue(true);
      const result = await service.remove(8, businessReq);
      expect(
        businessHoursGettersServiceMock.findOneByIdAndBusiness,
      ).toHaveBeenCalledWith(8, 100);
      expect(businessHoursSettersServiceMock.remove).toHaveBeenCalledWith(row);
      expect(result).toBe(true);
    });
  });

  describe('findAllByBusiness', () => {
    it('delegates to getters', async () => {
      const list: BusinessHour[] = [];
      businessHoursGettersServiceMock.findAllByBusiness.mockResolvedValue(list);
      const result = await service.findAllByBusiness(200);
      expect(businessHoursGettersServiceMock.findAllByBusiness).toHaveBeenCalledWith(
        200,
      );
      expect(result).toBe(list);
    });
  });

  describe('findAllMyBusinessHours', () => {
    it('loads schedule for the authenticated business id', async () => {
      const list: BusinessHour[] = [];
      businessHoursGettersServiceMock.findAllByBusiness.mockResolvedValue(list);
      const result = await service.findAllMyBusinessHours(businessReq);
      expect(businessHoursGettersServiceMock.findAllByBusiness).toHaveBeenCalledWith(
        100,
      );
      expect(result).toBe(list);
    });
  });
});
