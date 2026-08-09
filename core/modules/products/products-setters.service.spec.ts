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
import { getQueueToken } from '@nestjs/bullmq';
import { ProductsSettersService } from './products-setters.service';
import { Product } from '../../entities';
import { EntityAuditsQueueService } from '../entity-audits/entity-audits-queue.service';
import {
  AuditableEntityNameEnum,
  AuditOperationEnum,
  QueueNamesEnum,
  SearchDataConsumerEnum,
  StatusEnum,
} from '../../common/enums';
import type { IBusinessReq } from '../../common/interfaces';
import type { IUserReq } from '../../common/interfaces';

/**
 * Unit tests for {@link ProductsSettersService}.
 */
describe('ProductsSettersService', () => {
  const repositoryMock = {
    save: jest.fn(),
    update: jest.fn(),
    findOneOrFail: jest.fn(),
    metadata: {
      columns: [
        { propertyName: 'id' },
        { propertyName: 'title' },
        { propertyName: 'idCatalog' },
        { propertyName: 'idCreationBusiness' },
        { propertyName: 'likes' },
        { propertyName: 'visits' },
        { propertyName: 'ratingAverage' },
        { propertyName: 'stockNotified' },
        { propertyName: 'status' },
      ],
    },
  };
  const entityAuditsQueueServiceMock = {
    addRecordJob: jest.fn().mockResolvedValue(undefined),
  };
  const searchDataQueueMock = {
    add: jest.fn().mockResolvedValue(undefined),
  };
  let service: ProductsSettersService;
  const businessReq: IBusinessReq = { businessId: 10, path: '/x' };
  const userReq: IUserReq = { userId: 3, username: 'u' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsSettersService,
        {
          provide: getRepositoryToken(Product),
          useValue: repositoryMock,
        },
        {
          provide: EntityAuditsQueueService,
          useValue: entityAuditsQueueServiceMock,
        },
        {
          provide: getQueueToken(QueueNamesEnum.searchData),
          useValue: searchDataQueueMock,
        },
      ],
    }).compile();
    service = moduleRef.get(ProductsSettersService);
  });

  describe('create', () => {
    it('persists product and enqueues insert audit', async () => {
      const saved = { id: 20, title: 'P' } as Product;
      repositoryMock.save.mockResolvedValue(saved);
      await expect(
        service.create({ title: 'P', idCatalog: 1 } as never, businessReq),
      ).resolves.toBe(saved);
      expect(entityAuditsQueueServiceMock.addRecordJob).toHaveBeenCalledWith(
        expect.objectContaining({
          entityName: AuditableEntityNameEnum.Product,
          entityId: 20,
          operation: AuditOperationEnum.INSERT,
        }),
      );
    });
    it('throws InternalServerErrorException when save fails', async () => {
      repositoryMock.save.mockRejectedValue(new Error('db'));
      await expect(
        service.create({ title: 'x' } as never, businessReq),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    it('updates entity and enqueues audit', async () => {
      const product = { id: 1, title: 'Old' } as Product;
      const updated = { ...product, title: 'New' } as Product;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(updated);
      await expect(
        service.update(product, { id: 1, title: 'New' } as never, businessReq),
      ).resolves.toEqual(updated);
    });
  });

  describe('remove', () => {
    it('enqueues delete and soft-deletes', async () => {
      const product = { id: 2, idCatalog: 5 } as Product;
      const reloaded = { ...product, status: StatusEnum.DELETED } as Product;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(reloaded);
      await expect(service.remove(product, businessReq)).resolves.toBeUndefined();
    });
  });

  describe('incrementLikes', () => {
    it('increments likes via updateEntity', async () => {
      const product = { id: 1, likes: 4 } as Product;
      const reloaded = { ...product, likes: 5 } as Product;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(reloaded);
      await service.incrementLikes(product, userReq);
      expect(repositoryMock.update).toHaveBeenCalled();
    });
  });

  describe('queueForIdProduct', () => {
    it('enqueues search data job with delay', async () => {
      await service.queueForIdProduct(99);
      expect(searchDataQueueMock.add).toHaveBeenCalledWith(
        SearchDataConsumerEnum.SearchDataProduct,
        { idProduct: 99 },
        { delay: 1000 * 60 },
      );
    });
  });
});
