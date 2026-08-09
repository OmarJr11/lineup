import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityAuditsService } from './entity-audits.service';
import { EntityAuditsGettersService } from './entity-audits-getters.service';
import { EntityAuditsSettersService } from './entity-audits-setters.service';
import { EntityAudit } from '../../entities';
import {
  AuditOperationEnum,
  AuditableEntityNameEnum,
} from '../../common/enums';

/**
 * Unit tests for {@link EntityAuditsService}.
 */
describe('EntityAuditsService', () => {
  const gettersMock = {
    findByEntity: jest.fn(),
    findByDiscountProductByProductId: jest.fn(),
    findByDiscountProductByDiscountId: jest.fn(),
  };
  const settersMock = {
    record: jest.fn(),
  };
  let service: EntityAuditsService;
  const businessReq = { path: '/b', businessId: 3 };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        EntityAuditsService,
        { provide: REQUEST, useValue: {} },
        {
          provide: getRepositoryToken(EntityAudit),
          useValue: {},
        },
        {
          provide: EntityAuditsGettersService,
          useValue: gettersMock,
        },
        {
          provide: EntityAuditsSettersService,
          useValue: settersMock,
        },
      ],
    }).compile();
    service = await moduleRef.resolve(EntityAuditsService);
  });

  describe('findByEntity', () => {
    it('delegates to getters', async () => {
      const rows: EntityAudit[] = [];
      gettersMock.findByEntity.mockResolvedValue(rows);
      await expect(service.findByEntity('X', 1, 5)).resolves.toBe(rows);
      expect(gettersMock.findByEntity).toHaveBeenCalledWith('X', 1, 5);
    });
  });

  describe('findByDiscountProductByProductId', () => {
    it('delegates to getters', async () => {
      const rows: EntityAudit[] = [];
      gettersMock.findByDiscountProductByProductId.mockResolvedValue(rows);
      await expect(service.findByDiscountProductByProductId(9)).resolves.toBe(
        rows,
      );
    });
  });

  describe('findByDiscountProductByDiscountId', () => {
    it('delegates to getters', async () => {
      const rows: EntityAudit[] = [];
      gettersMock.findByDiscountProductByDiscountId.mockResolvedValue(rows);
      await expect(
        service.findByDiscountProductByDiscountId(2),
      ).resolves.toBe(rows);
    });
  });

  describe('record', () => {
    it('delegates to setters', async () => {
      const saved = { id: 1 } as EntityAudit;
      const input = {
        entityName: AuditableEntityNameEnum.Discount,
        entityId: 1,
        operation: AuditOperationEnum.INSERT,
      };
      settersMock.record.mockResolvedValue(saved);
      await expect(service.record(input, businessReq)).resolves.toBe(saved);
      expect(settersMock.record).toHaveBeenCalledWith(input, businessReq);
    });
  });

  describe('recordDiscountProduct', () => {
    it('builds DTO and delegates to setters', async () => {
      const saved = { id: 2 } as EntityAudit;
      settersMock.record.mockResolvedValue(saved);
      const result = await service.recordDiscountProduct(
        10,
        1,
        2,
        AuditOperationEnum.UPDATE,
        businessReq,
      );
      expect(settersMock.record).toHaveBeenCalledWith(
        {
          entityName: AuditableEntityNameEnum.DiscountProduct,
          entityId: 10,
          operation: AuditOperationEnum.UPDATE,
          oldValues: { idProduct: 10, idDiscount: 1 },
          newValues: { idProduct: 10, idDiscount: 2 },
        },
        businessReq,
      );
      expect(result).toBe(saved);
    });
  });
});
