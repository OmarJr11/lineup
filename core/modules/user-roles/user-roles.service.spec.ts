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
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Request } from 'express';
import { UserRolesService } from './user-roles.service';
import { UserRolesGettersService } from './user-roles-getters.service';
import { UserRole } from '../../entities';
import type { IUserReq } from '../../common/interfaces';

/**
 * Unit tests for {@link UserRolesService}.
 */
describe('UserRolesService', () => {
  let service: UserRolesService;
  const gettersMock = {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    findAllByUserId: jest.fn(),
  };
  const saveMock = jest.fn();
  const removeMock = jest.fn();
  const userReq: IUserReq = { userId: 9, username: 'admin' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UserRolesService,
        { provide: REQUEST, useValue: {} as Request },
        {
          provide: getRepositoryToken(UserRole),
          useValue: {
            save: saveMock,
            remove: removeMock,
          },
        },
        {
          provide: UserRolesGettersService,
          useValue: gettersMock,
        },
      ],
    }).compile();
    service = await moduleRef.resolve(UserRolesService);
  });

  describe('create', () => {
    it('throws BadRequestException when assignment already exists', async () => {
      gettersMock.findOne.mockResolvedValue({ idUser: 1, idRole: 2 } as UserRole);
      await expect(service.create(1, 2, userReq)).rejects.toThrow(
        BadRequestException,
      );
      expect(saveMock).not.toHaveBeenCalled();
    });

    it('persists new user role when absent', async () => {
      gettersMock.findOne.mockResolvedValue(null);
      const saved = { idUser: 1, idRole: 2 } as UserRole;
      saveMock.mockResolvedValue(saved);
      await expect(service.create(1, 2, userReq)).resolves.toBe(saved);
      expect(saveMock).toHaveBeenCalled();
    });

    it('throws InternalServerErrorException when save fails', async () => {
      gettersMock.findOne.mockResolvedValue(null);
      saveMock.mockRejectedValue(new Error('db'));
      await expect(service.create(1, 2, userReq)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('removeUserRole', () => {
    it('removes entity when found', async () => {
      const ur = { idUser: 1, idRole: 2 } as UserRole;
      gettersMock.findOneOrFail.mockResolvedValue(ur);
      removeMock.mockResolvedValue(ur);
      await expect(service.removeUserRole(1, 2, userReq)).resolves.toBeUndefined();
      expect(removeMock).toHaveBeenCalled();
    });

    it('throws InternalServerErrorException when remove fails', async () => {
      const ur = { idUser: 1, idRole: 2 } as UserRole;
      gettersMock.findOneOrFail.mockResolvedValue(ur);
      removeMock.mockRejectedValue(new Error('db'));
      await expect(service.removeUserRole(1, 2, userReq)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAllByUserId', () => {
    it('delegates to getters', async () => {
      const list: UserRole[] = [];
      gettersMock.findAllByUserId.mockResolvedValue(list);
      await expect(service.findAllByUserId(3)).resolves.toBe(list);
    });
  });
});
