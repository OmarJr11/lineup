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
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessHoursSettersService } from './business-hours-setters.service';
import { BusinessHour } from '../../entities';
import { WeekDayEnum } from '../../common/enums/week-day.enum';

/**
 * Unit tests for {@link BusinessHoursSettersService}.
 */
describe('BusinessHoursSettersService', () => {
  const repositoryMock = {
    save: jest.fn(),
    remove: jest.fn(),
  };
  let service: BusinessHoursSettersService;
  const businessReq = { businessId: 10, path: '/businesses' };

  beforeEach(async () => {
    jest.clearAllMocks();
    repositoryMock.save.mockImplementation((entity: BusinessHour) =>
      Promise.resolve(entity),
    );
    repositoryMock.remove.mockResolvedValue(undefined);
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessHoursSettersService,
        {
          provide: getRepositoryToken(BusinessHour),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(BusinessHoursSettersService);
  });

  describe('createMany', () => {
    it('throws when a slot has opensAtMinute >= closesAtMinute', async () => {
      const slots = [
        {
          dayOfWeek: WeekDayEnum.MONDAY,
          opensAtMinute: 700,
          closesAtMinute: 600,
          slotOrder: 1,
        },
      ];
      await expect(service.createMany(slots, businessReq)).rejects.toThrow(
        BadRequestException,
      );
      expect(repositoryMock.save).not.toHaveBeenCalled();
    });
    it('throws when two rows share the same day and slotOrder', async () => {
      const slot = {
        dayOfWeek: WeekDayEnum.TUESDAY,
        opensAtMinute: 100,
        closesAtMinute: 200,
        slotOrder: 1,
      };
      await expect(
        service.createMany([slot, { ...slot }], businessReq),
      ).rejects.toThrow(BadRequestException);
    });
    it('persists each valid slot with idBusiness from the request', async () => {
      const slots = [
        {
          dayOfWeek: WeekDayEnum.WEDNESDAY,
          opensAtMinute: 100,
          closesAtMinute: 200,
          slotOrder: 1,
        },
      ];
      await service.createMany(slots, businessReq);
      expect(repositoryMock.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws when resolved open/close range is invalid', async () => {
      const hour = {
        id: 1,
        opensAtMinute: 500,
        closesAtMinute: 600,
      } as BusinessHour;
      await expect(
        service.update(
          hour,
          { id: 1, opensAtMinute: 700, closesAtMinute: 650 },
          businessReq,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('returns true after repository remove', async () => {
      const hour = { id: 3 } as BusinessHour;
      const result = await service.remove(hour);
      expect(result).toBe(true);
      expect(repositoryMock.remove).toHaveBeenCalled();
    });
  });
});
