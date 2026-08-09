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

import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DiscountsSettersService } from './discounts-setters.service';
import { DiscountProductsGettersService } from '../discount-products/discount-products-getters.service';
import { DiscountProductsSettersService } from '../discount-products/discount-products-setters.service';
import { EntityAuditsQueueService } from '../entity-audits/entity-audits-queue.service';
import { Discount } from '../../entities';
import {
  AuditableEntityNameEnum,
  AuditOperationEnum,
  DiscountScopeEnum,
  DiscountTypeEnum,
  StatusEnum,
} from '../../common/enums';

/**
 * Unit tests for {@link DiscountsSettersService}.
 */
describe('DiscountsSettersService', () => {
  const repositoryMock = {
    save: jest.fn(),
    update: jest.fn(),
    findOneOrFail: jest.fn(),
    metadata: {
      columns: [
        { propertyName: 'id' },
        { propertyName: 'discountType' },
        { propertyName: 'value' },
        { propertyName: 'idCurrency' },
        { propertyName: 'startDate' },
        { propertyName: 'endDate' },
        { propertyName: 'isExpired' },
        { propertyName: 'scope' },
        { propertyName: 'idCatalog' },
        { propertyName: 'status' },
        { propertyName: 'idCreationBusiness' },
        { propertyName: 'modificationDate' },
        { propertyName: 'modificationUser' },
        { propertyName: 'modificationBusiness' },
        { propertyName: 'creationDate' },
        { propertyName: 'creationUser' },
        { propertyName: 'creationIp' },
        { propertyName: 'modificationIp' },
        { propertyName: 'creationCoordinate' },
        { propertyName: 'modificationCoordinate' },
      ],
    },
  };
  const discountProductsGettersMock = {
    findByProductId: jest.fn(),
    findAllByDiscountId: jest.fn(),
  };
  const discountProductsSettersMock = {
    updateDiscount: jest.fn(),
    create: jest.fn(),
    removeMany: jest.fn(),
  };
  const entityAuditsQueueMock = {
    addRecordJob: jest.fn(),
  };
  let service: DiscountsSettersService;
  const businessReq = { path: '/', businessId: 2 };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountsSettersService,
        {
          provide: getRepositoryToken(Discount),
          useValue: repositoryMock,
        },
        {
          provide: DiscountProductsGettersService,
          useValue: discountProductsGettersMock,
        },
        {
          provide: DiscountProductsSettersService,
          useValue: discountProductsSettersMock,
        },
        {
          provide: EntityAuditsQueueService,
          useValue: entityAuditsQueueMock,
        },
      ],
    }).compile();
    service = moduleRef.get(DiscountsSettersService);
  });

  describe('createDiscount', () => {
    it('saves discount and enqueues audit job', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(today);
      end.setDate(end.getDate() + 7);
      end.setHours(23, 59, 59, 999);
      const saved = {
        id: 90,
        scope: DiscountScopeEnum.BUSINESS,
        discountType: DiscountTypeEnum.PERCENTAGE,
        value: 5,
        startDate: today,
        endDate: end,
        status: StatusEnum.ACTIVE,
        idCreationBusiness: 2,
      } as Discount;
      repositoryMock.save.mockResolvedValue(saved);
      entityAuditsQueueMock.addRecordJob.mockResolvedValue(undefined);
      const data = {
        scope: DiscountScopeEnum.BUSINESS,
        discountType: DiscountTypeEnum.PERCENTAGE,
        value: 5,
        startDate: today,
        endDate: end,
      };
      const result = await service.createDiscount(data, businessReq);
      expect(result.id).toBe(90);
      expect(entityAuditsQueueMock.addRecordJob).toHaveBeenCalledWith(
        expect.objectContaining({
          entityName: AuditableEntityNameEnum.Discount,
          entityId: 90,
          operation: AuditOperationEnum.INSERT,
        }),
      );
    });
    it('throws InternalServerErrorException when save fails', async () => {
      const today = new Date();
      const end = new Date(today.getTime() + 86_400_000);
      repositoryMock.save.mockRejectedValue(new Error('db'));
      await expect(
        service.createDiscount(
          {
            scope: DiscountScopeEnum.BUSINESS,
            discountType: DiscountTypeEnum.PERCENTAGE,
            value: 1,
            startDate: today,
            endDate: end,
          },
          businessReq,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('markAsExpired', () => {
    it('updates isExpired on the entity', async () => {
      const discount = { id: 3, isExpired: false } as Discount;
      const updated = { ...discount, isExpired: true } as Discount;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(updated);
      await service.markAsExpired(discount, { userId: 1, username: 'u' });
      expect(repositoryMock.update).toHaveBeenCalled();
    });
  });

  describe('upsertDiscountProduct', () => {
    it('updates when a discount-product row exists for the product', async () => {
      const existing = {
        id: 1,
        idProduct: 5,
        idDiscount: 10,
      } as never;
      const reloaded = {
        id: 1,
        idProduct: 5,
        idDiscount: 20,
      } as never;
      discountProductsGettersMock.findByProductId
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(reloaded);
      discountProductsSettersMock.updateDiscount.mockResolvedValue(undefined);
      entityAuditsQueueMock.addRecordJob.mockResolvedValue(undefined);
      const result = await service.upsertDiscountProduct(5, 20, businessReq);
      expect(entityAuditsQueueMock.addRecordJob).toHaveBeenCalled();
      expect(discountProductsSettersMock.updateDiscount).toHaveBeenCalled();
      expect(result).toEqual(reloaded);
    });
    it('creates when no row exists for the product', async () => {
      const created = { id: 2, idProduct: 7, idDiscount: 30 } as never;
      discountProductsGettersMock.findByProductId.mockResolvedValue(null);
      discountProductsSettersMock.create.mockResolvedValue(created);
      entityAuditsQueueMock.addRecordJob.mockResolvedValue(undefined);
      const result = await service.upsertDiscountProduct(7, 30, businessReq);
      expect(discountProductsSettersMock.create).toHaveBeenCalledWith(
        7,
        30,
        businessReq,
      );
      expect(result).toEqual(created);
    });
  });
});
