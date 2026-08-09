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
import { ProductSkusSettersService } from './product-skus-setters.service';
import { ProductSku } from '../../entities';
import { EntityAuditsQueueService } from '../entity-audits/entity-audits-queue.service';
import {
  AuditableEntityNameEnum,
  AuditOperationEnum,
  StatusEnum,
} from '../../common/enums';
import type { IBusinessReq } from '../../common/interfaces';

/**
 * Unit tests for {@link ProductSkusSettersService}.
 */
describe('ProductSkusSettersService', () => {
  const repositoryMock = {
    save: jest.fn(),
    update: jest.fn(),
    findOneOrFail: jest.fn(),
    metadata: {
      columns: [
        { propertyName: 'id' },
        { propertyName: 'idProduct' },
        { propertyName: 'skuCode' },
        { propertyName: 'quantity' },
        { propertyName: 'price' },
        { propertyName: 'idCurrency' },
        { propertyName: 'variationOptions' },
        { propertyName: 'status' },
        { propertyName: 'idCreationBusiness' },
      ],
    },
  };
  const entityAuditsQueueServiceMock = {
    addRecordJob: jest.fn().mockResolvedValue(undefined),
  };
  let service: ProductSkusSettersService;
  const businessReq: IBusinessReq = { businessId: 1, path: '/b' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductSkusSettersService,
        {
          provide: getRepositoryToken(ProductSku),
          useValue: repositoryMock,
        },
        {
          provide: EntityAuditsQueueService,
          useValue: entityAuditsQueueServiceMock,
        },
      ],
    }).compile();
    service = moduleRef.get(ProductSkusSettersService);
  });

  describe('create', () => {
    it('persists sku and enqueues insert audit', async () => {
      const saved = {
        id: 20,
        idProduct: 5,
        skuCode: 'SKU-1',
      } as ProductSku;
      repositoryMock.save.mockResolvedValue(saved);
      const input = {
        idProduct: 5,
        skuCode: 'SKU-1',
        variationOptions: [{ variationTitle: 'Color', option: 'Red' }],
        quantity: 10,
      };
      await expect(service.create(input, businessReq)).resolves.toBe(saved);
      expect(entityAuditsQueueServiceMock.addRecordJob).toHaveBeenCalledWith(
        expect.objectContaining({
          entityName: AuditableEntityNameEnum.ProductSku,
          entityId: 20,
          operation: AuditOperationEnum.INSERT,
        }),
      );
    });
    it('throws InternalServerErrorException when save fails', async () => {
      repositoryMock.save.mockRejectedValue(new Error('db'));
      await expect(
        service.create(
          {
            idProduct: 1,
            skuCode: 'x',
            variationOptions: [],
          },
          businessReq,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    it('updates sku and enqueues update audit', async () => {
      const existing = { id: 3, quantity: 1 } as ProductSku;
      const updated = { ...existing, quantity: 5 } as ProductSku;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(updated);
      await expect(
        service.update(existing, { quantity: 5 }, businessReq),
      ).resolves.toEqual(updated);
      expect(entityAuditsQueueServiceMock.addRecordJob).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: AuditOperationEnum.UPDATE,
        }),
      );
    });
  });

  describe('remove', () => {
    it('enqueues delete audit and soft-deletes', async () => {
      const sku = { id: 4, idProduct: 1 } as ProductSku;
      const reloaded = { ...sku, status: StatusEnum.DELETED } as ProductSku;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(reloaded);
      await expect(service.remove(sku, businessReq)).resolves.toBeUndefined();
      expect(entityAuditsQueueServiceMock.addRecordJob).toHaveBeenCalledWith(
        expect.objectContaining({
          entityName: AuditableEntityNameEnum.ProductSku,
          entityId: 4,
          operation: AuditOperationEnum.DELETE,
        }),
      );
    });
  });
});
