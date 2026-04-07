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
import { REQUEST } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessRolesService } from './business-roles.service';
import { BusinessRolesGettersService } from './business-roles-getters.service';
import { BusinessRole } from '../../entities';

/**
 * Unit tests for {@link BusinessRolesService}.
 */
describe('BusinessRolesService', () => {
  const businessRolesGettersServiceMock = {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    findAllByBusinessId: jest.fn(),
  };
  const repositoryMock = {
    save: jest.fn(),
    remove: jest.fn(),
  };
  let service: BusinessRolesService;
  const user = { userId: 1 };

  beforeEach(async () => {
    jest.clearAllMocks();
    repositoryMock.save.mockImplementation((data: BusinessRole) =>
      Promise.resolve({ ...data, id: 99 } as BusinessRole),
    );
    repositoryMock.remove.mockResolvedValue(undefined);
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessRolesService,
        { provide: REQUEST, useValue: {} },
        {
          provide: getRepositoryToken(BusinessRole),
          useValue: repositoryMock,
        },
        {
          provide: BusinessRolesGettersService,
          useValue: businessRolesGettersServiceMock,
        },
      ],
    }).compile();
    service = await moduleRef.resolve(BusinessRolesService);
  });

  describe('create', () => {
    it('throws when the business-role pair already exists', async () => {
      businessRolesGettersServiceMock.findOne.mockResolvedValue({
        id: 1,
      } as unknown as BusinessRole);
      await expect(service.create(10, 20, user)).rejects.toThrow(
        BadRequestException,
      );
      expect(repositoryMock.save).not.toHaveBeenCalled();
    });
    it('persists when no duplicate exists', async () => {
      businessRolesGettersServiceMock.findOne.mockResolvedValue(null);
      await service.create(10, 20, user);
      expect(repositoryMock.save).toHaveBeenCalled();
    });
  });

  describe('removeBusinessRole', () => {
    it('removes the entity returned by findOneOrFail', async () => {
      const br = { idBusiness: 10, idRole: 20 } as BusinessRole;
      businessRolesGettersServiceMock.findOneOrFail.mockResolvedValue(br);
      await service.removeBusinessRole(10, 20, user);
      expect(repositoryMock.remove).toHaveBeenCalledWith(br, { data: user });
    });
  });

  describe('findAllByBusinessId', () => {
    it('delegates to getters', async () => {
      const list: BusinessRole[] = [];
      businessRolesGettersServiceMock.findAllByBusinessId.mockResolvedValue(list);
      const result = await service.findAllByBusinessId(7);
      expect(
        businessRolesGettersServiceMock.findAllByBusinessId,
      ).toHaveBeenCalledWith(7);
      expect(result).toBe(list);
    });
  });
});
