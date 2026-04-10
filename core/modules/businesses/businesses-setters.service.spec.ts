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
import { BusinessesSettersService } from './businesses-setters.service';
import { BusinessRolesService } from '../business-roles/business-roles.service';
import { RolesService } from '../roles/roles.service';
import { EntityAuditsQueueService } from '../entity-audits/entity-audits-queue.service';
import { Business } from '../../entities';
import { RolesCodesEnum } from '../../common/enums';
import { CreateBusinessInput } from './dto/create-business.input';

/**
 * Unit tests for {@link BusinessesSettersService}.
 */
describe('BusinessesSettersService', () => {
  const repositoryMock = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const businessRolesServiceMock = {
    create: jest.fn(),
  };
  const rolesServiceMock = {
    findByCode: jest.fn(),
  };
  const entityAuditsQueueServiceMock = {
    addRecordJob: jest.fn(),
  };
  let service: BusinessesSettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessesSettersService,
        {
          provide: getRepositoryToken(Business),
          useValue: repositoryMock,
        },
        {
          provide: BusinessRolesService,
          useValue: businessRolesServiceMock,
        },
        { provide: RolesService, useValue: rolesServiceMock },
        {
          provide: EntityAuditsQueueService,
          useValue: entityAuditsQueueServiceMock,
        },
      ],
    }).compile();
    service = moduleRef.get(BusinessesSettersService);
  });

  describe('create', () => {
    it('throws BadRequestException when email already exists', async () => {
      repositoryMock.findOne.mockResolvedValue({ id: 1 } as Business);
      const data: CreateBusinessInput = {
        email: 'dup@test.com',
        name: 'N',
        password: 'x',
        role: RolesCodesEnum.BUSINESS,
      };
      await expect(service.create(data)).rejects.toThrow(BadRequestException);
      expect(repositoryMock.save).not.toHaveBeenCalled();
    });
  });
});
