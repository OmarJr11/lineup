import { ForbiddenException, NotAcceptableException } from '@nestjs/common';
import type { Queue } from 'bullmq';
import type { Repository } from 'typeorm';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { UsersSettersService } from './users.setters.service';
import { UsersGettersService } from './users.getters.service';
import { RolesService } from '../roles/roles.service';
import { UserRolesService } from '../user-roles/user-roles.service';
import { StatesGettersService } from '../states/states-getters.service';
import { FilesGettersService } from '../files/files-getters.service';
import { User } from '../../entities';
import type { IUserReq } from '../../common/interfaces';
import { InfinityScrollInput } from '../../common/dtos';

/**
 * Unit tests for {@link UsersService}.
 */
describe('UsersService', () => {
  let service: UsersService;
  const gettersMock = {
    findOne: jest.fn(),
    findAll: jest.fn(),
  };
  const settersMock = {
    remove: jest.fn(),
  };
  const rolesMock = {};
  const userRolesMock = {};
  const statesMock = {
    findById: jest.fn(),
  };
  const filesMock = {
    getImageByName: jest.fn(),
  };
  const notificationsQueueMock = {
    add: jest.fn(),
  };
  const userReq: IUserReq = { userId: 10, username: 'self' };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(
      {} as Request,
      {} as Repository<User>,
      settersMock as unknown as UsersSettersService,
      gettersMock as unknown as UsersGettersService,
      rolesMock as RolesService,
      userRolesMock as UserRolesService,
      statesMock as unknown as StatesGettersService,
      filesMock as unknown as FilesGettersService,
      notificationsQueueMock as unknown as Queue,
    );
  });

  describe('findOne', () => {
    it('throws NotAcceptableException when id is falsy', async () => {
      await expect(service.findOne(0)).rejects.toThrow(NotAcceptableException);
      expect(gettersMock.findOne).not.toHaveBeenCalled();
    });

    it('delegates to getters when id is valid', async () => {
      const u = { id: 5 } as User;
      gettersMock.findOne.mockResolvedValue(u);
      await expect(service.findOne(5)).resolves.toBe(u);
      expect(gettersMock.findOne).toHaveBeenCalledWith(5);
    });
  });

  describe('findAll', () => {
    it('delegates to getters', async () => {
      const q = { page: 1 } as InfinityScrollInput;
      const list: User[] = [];
      gettersMock.findAll.mockResolvedValue(list);
      await expect(service.findAll(q)).resolves.toBe(list);
      expect(gettersMock.findAll).toHaveBeenCalledWith(q);
    });
  });

  describe('validateUserId', () => {
    it('throws ForbiddenException when ids differ', async () => {
      await expect(service.validateUserId(1, userReq)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('resolves when ids match', async () => {
      await expect(
        service.validateUserId(10, userReq),
      ).resolves.toBeUndefined();
    });
  });

  describe('remove', () => {
    it('loads user then delegates to setters', async () => {
      const toDelete = { id: 3 } as User;
      gettersMock.findOne.mockResolvedValue(toDelete);
      settersMock.remove.mockResolvedValue(undefined);
      await service.remove(3, userReq);
      expect(settersMock.remove).toHaveBeenCalledWith(toDelete, userReq);
    });
  });
});
