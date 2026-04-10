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
import { ProductVariationsSettersService } from './product-variations-setters.service';
import { ProductVariation } from '../../entities';
import { EntityAuditsQueueService } from '../entity-audits/entity-audits-queue.service';
import {
  AuditableEntityNameEnum,
  AuditOperationEnum,
  StatusEnum,
} from '../../common/enums';
import type { IBusinessReq } from '../../common/interfaces';
import type { ProductVariationInput } from '../products/dto/product-variation.input';

/**
 * Unit tests for {@link ProductVariationsSettersService}.
 */
describe('ProductVariationsSettersService', () => {
  const repositoryMock = {
    save: jest.fn(),
    update: jest.fn(),
    findOneOrFail: jest.fn(),
    metadata: {
      columns: [
        { propertyName: 'id' },
        { propertyName: 'title' },
        { propertyName: 'options' },
        { propertyName: 'idProduct' },
        { propertyName: 'status' },
        { propertyName: 'idCreationBusiness' },
      ],
    },
  };
  const entityAuditsQueueServiceMock = {
    addRecordJob: jest.fn().mockResolvedValue(undefined),
  };
  let service: ProductVariationsSettersService;
  const businessReq: IBusinessReq = { businessId: 1, path: '/b' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductVariationsSettersService,
        {
          provide: getRepositoryToken(ProductVariation),
          useValue: repositoryMock,
        },
        {
          provide: EntityAuditsQueueService,
          useValue: entityAuditsQueueServiceMock,
        },
      ],
    }).compile();
    service = moduleRef.get(ProductVariationsSettersService);
  });

  describe('create', () => {
    it('persists variation and enqueues insert audit', async () => {
      const saved = {
        id: 10,
        title: 'Color',
        idProduct: 3,
      } as ProductVariation;
      repositoryMock.save.mockResolvedValue(saved);
      const input = {
        title: 'Color',
        options: [{ value: 'Red' }],
        idProduct: 3,
      } as ProductVariationInput;
      await expect(service.create(input, businessReq)).resolves.toBe(saved);
      expect(entityAuditsQueueServiceMock.addRecordJob).toHaveBeenCalledWith(
        expect.objectContaining({
          entityName: AuditableEntityNameEnum.ProductVariation,
          entityId: 10,
          operation: AuditOperationEnum.INSERT,
        }),
      );
    });
    it('throws InternalServerErrorException when save fails', async () => {
      repositoryMock.save.mockRejectedValue(new Error('db'));
      await expect(
        service.create(
          {
            title: 'Size',
            options: [{ value: 'M' }],
            idProduct: 1,
          } as ProductVariationInput,
          businessReq,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    it('updates and enqueues audit', async () => {
      const existing = { id: 4, title: 'Old' } as ProductVariation;
      const updated = { ...existing, title: 'New' } as ProductVariation;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(updated);
      await expect(
        service.update(
          existing,
          {
            id: 4,
            title: 'New',
            options: [{ value: 'S' }],
            idProduct: 1,
          } as ProductVariationInput,
          businessReq,
        ),
      ).resolves.toEqual(updated);
    });
  });

  describe('remove', () => {
    it('enqueues delete and soft-deletes', async () => {
      const variation = { id: 6, idProduct: 1 } as ProductVariation;
      const reloaded = {
        ...variation,
        status: StatusEnum.DELETED,
      } as ProductVariation;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(reloaded);
      await expect(service.remove(variation, businessReq)).resolves.toEqual(
        reloaded,
      );
    });
  });
});
