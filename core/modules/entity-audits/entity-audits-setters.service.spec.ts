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
import { EntityAuditsSettersService } from './entity-audits-setters.service';
import { EntityAudit } from '../../entities';
import {
  AuditableEntityNameEnum,
  AuditOperationEnum,
} from '../../common/enums';

/**
 * Unit tests for {@link EntityAuditsSettersService}.
 */
describe('EntityAuditsSettersService', () => {
  const repositoryMock = {
    save: jest.fn(),
  };
  let service: EntityAuditsSettersService;
  const userReq = { userId: 1, username: 'u1' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        EntityAuditsSettersService,
        {
          provide: getRepositoryToken(EntityAudit),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(EntityAuditsSettersService);
  });

  describe('record', () => {
    it('persists via save', async () => {
      const saved = { id: 1 } as EntityAudit;
      repositoryMock.save.mockResolvedValue(saved);
      const input = {
        entityName: AuditableEntityNameEnum.Discount,
        entityId: 9,
        operation: AuditOperationEnum.INSERT,
        newValues: { x: 1 },
      };
      await expect(service.record(input, userReq)).resolves.toBe(saved);
      expect(repositoryMock.save).toHaveBeenCalled();
    });
    it('throws InternalServerErrorException when save fails', async () => {
      repositoryMock.save.mockRejectedValue(new Error('db'));
      await expect(
        service.record(
          {
            entityName: AuditableEntityNameEnum.Discount,
            entityId: 1,
            operation: AuditOperationEnum.INSERT,
          },
          userReq,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
