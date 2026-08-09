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
import { SocialNetworkBusinessesSettersService } from './social-network-businesses-setters.service';
import { SocialNetworkBusiness } from '../../entities';
import { EntityAuditsQueueService } from '../entity-audits/entity-audits-queue.service';
import {
  AuditableEntityNameEnum,
  AuditOperationEnum,
  StatusEnum,
} from '../../common/enums';
import type { IBusinessReq } from '../../common/interfaces';

/**
 * Unit tests for {@link SocialNetworkBusinessesSettersService}.
 */
describe('SocialNetworkBusinessesSettersService', () => {
  const repositoryMock = {
    save: jest.fn(),
    update: jest.fn(),
    findOneOrFail: jest.fn(),
    metadata: {
      columns: [
        { propertyName: 'id' },
        { propertyName: 'idSocialNetwork' },
        { propertyName: 'url' },
        { propertyName: 'phone' },
        { propertyName: 'status' },
        { propertyName: 'idCreationBusiness' },
      ],
    },
  };
  const entityAuditsQueueServiceMock = {
    addRecordJob: jest.fn().mockResolvedValue(undefined),
  };
  let service: SocialNetworkBusinessesSettersService;
  const businessReq: IBusinessReq = { businessId: 1, path: '/b' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SocialNetworkBusinessesSettersService,
        {
          provide: getRepositoryToken(SocialNetworkBusiness),
          useValue: repositoryMock,
        },
        {
          provide: EntityAuditsQueueService,
          useValue: entityAuditsQueueServiceMock,
        },
      ],
    }).compile();
    service = moduleRef.get(SocialNetworkBusinessesSettersService);
  });

  describe('create', () => {
    it('persists and enqueues insert audit', async () => {
      const saved = { id: 10, idSocialNetwork: 3 } as SocialNetworkBusiness;
      repositoryMock.save.mockResolvedValue(saved);
      const input = {
        idSocialNetwork: 3,
        contact: { url: 'https://x.com/a', phone: '' },
      };
      await expect(service.create(input, businessReq)).resolves.toBe(saved);
      expect(entityAuditsQueueServiceMock.addRecordJob).toHaveBeenCalledWith(
        expect.objectContaining({
          entityName: AuditableEntityNameEnum.SocialNetworkBusiness,
          entityId: 10,
          operation: AuditOperationEnum.INSERT,
        }),
      );
    });
    it('throws InternalServerErrorException when save fails', async () => {
      repositoryMock.save.mockRejectedValue(new Error('db'));
      await expect(
        service.create(
          { idSocialNetwork: 1, contact: { url: 'u', phone: '' } },
          businessReq,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('remove', () => {
    it('enqueues delete audit then soft-deletes via update', async () => {
      const snb = { id: 4 } as SocialNetworkBusiness;
      const reloaded = {
        ...snb,
        status: StatusEnum.DELETED,
      } as SocialNetworkBusiness;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(reloaded);
      await expect(service.remove(snb, businessReq)).resolves.toBe(true);
      expect(entityAuditsQueueServiceMock.addRecordJob).toHaveBeenCalledWith(
        expect.objectContaining({
          entityName: AuditableEntityNameEnum.SocialNetworkBusiness,
          entityId: 4,
          operation: AuditOperationEnum.DELETE,
        }),
      );
    });
  });
});
