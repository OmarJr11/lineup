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
import { ProductFilesSettersService } from './product-files-setters.service';
import { ProductFile } from '../../entities';
import { EntityAuditsQueueService } from '../entity-audits/entity-audits-queue.service';
import {
  AuditableEntityNameEnum,
  AuditOperationEnum,
  StatusEnum,
} from '../../common/enums';
import type { IBusinessReq } from '../../common/interfaces';

/**
 * Unit tests for {@link ProductFilesSettersService}.
 */
describe('ProductFilesSettersService', () => {
  const repositoryMock = {
    save: jest.fn(),
    update: jest.fn(),
    findOneOrFail: jest.fn(),
    metadata: {
      columns: [
        { propertyName: 'id' },
        { propertyName: 'imageCode' },
        { propertyName: 'idProduct' },
        { propertyName: 'order' },
        { propertyName: 'status' },
        { propertyName: 'idCreationBusiness' },
      ],
    },
  };
  const entityAuditsQueueServiceMock = {
    addRecordJob: jest.fn().mockResolvedValue(undefined),
  };
  let service: ProductFilesSettersService;
  const businessReq: IBusinessReq = { businessId: 1, path: '/b' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductFilesSettersService,
        {
          provide: getRepositoryToken(ProductFile),
          useValue: repositoryMock,
        },
        {
          provide: EntityAuditsQueueService,
          useValue: entityAuditsQueueServiceMock,
        },
      ],
    }).compile();
    service = moduleRef.get(ProductFilesSettersService);
  });

  describe('create', () => {
    it('persists entity and enqueues insert audit', async () => {
      const saved = {
        id: 10,
        imageCode: 'img-1',
        idProduct: 3,
        idCreationBusiness: 1,
      } as ProductFile;
      repositoryMock.save.mockResolvedValue(saved);
      const input = { imageCode: 'img-1', idProduct: 3 };
      await expect(service.create(input, businessReq)).resolves.toBe(saved);
      expect(repositoryMock.save).toHaveBeenCalled();
      expect(entityAuditsQueueServiceMock.addRecordJob).toHaveBeenCalledWith(
        expect.objectContaining({
          entityName: AuditableEntityNameEnum.ProductFile,
          entityId: 10,
          operation: AuditOperationEnum.INSERT,
        }),
      );
    });
    it('throws InternalServerErrorException when save fails', async () => {
      repositoryMock.save.mockRejectedValue(new Error('db'));
      await expect(
        service.create(
          { imageCode: 'x', idProduct: 1 },
          businessReq,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    it('updates entity and enqueues update audit', async () => {
      const existing = {
        id: 4,
        imageCode: 'a',
        idProduct: 2,
        idCreationBusiness: 1,
      } as ProductFile;
      const reloaded = { ...existing, order: 9 } as ProductFile;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(reloaded);
      await expect(
        service.update(existing, { id: 4, order: 9 }, businessReq),
      ).resolves.toEqual(reloaded);
      expect(entityAuditsQueueServiceMock.addRecordJob).toHaveBeenCalledWith(
        expect.objectContaining({
          entityName: AuditableEntityNameEnum.ProductFile,
          entityId: 4,
          operation: AuditOperationEnum.UPDATE,
        }),
      );
    });
  });

  describe('remove', () => {
    it('enqueues delete audit and soft-deletes by status', async () => {
      const file = {
        id: 6,
        imageCode: 'z',
        idProduct: 1,
        idCreationBusiness: 1,
      } as ProductFile;
      const reloaded = { ...file, status: StatusEnum.DELETED } as ProductFile;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(reloaded);
      await expect(service.remove(file, businessReq)).resolves.toEqual(
        reloaded,
      );
      expect(entityAuditsQueueServiceMock.addRecordJob).toHaveBeenCalledWith(
        expect.objectContaining({
          entityName: AuditableEntityNameEnum.ProductFile,
          entityId: 6,
          operation: AuditOperationEnum.DELETE,
        }),
      );
    });
  });
});
