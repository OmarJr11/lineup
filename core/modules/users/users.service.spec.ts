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

jest.mock('argon2', () => ({
  hash: jest.fn(() => Promise.resolve('argon-hashed')),
  verify: jest.fn(),
}));

jest.mock('../../common/helpers/generators.helper', () => ({
  generateRandomCodeByLength: jest.fn(() => 'random-pass-code-twenty'),
}));

import * as argon2 from 'argon2';
import {
  ForbiddenException,
  NotAcceptableException,
} from '@nestjs/common';
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
import { RolesCodesEnum } from '../../common/enums/roles.enum';
import { ProvidersEnum } from '../../common/enums/providers.enum';
import { NotificationsConsumerEnum } from '../../common/enums';
import { NotificationContentScenarioEnum } from '../../common/enums/notification-content-scenario.enum';
import type { CreateUserInput } from './dto/create-user.input';
import type { UpdateUserEmailInput } from './dto/update-user-email.input';
import { generateRandomCodeByLength } from '../../common/helpers/generators.helper';

/**
 * Unit tests for {@link UsersService}.
 */
describe('UsersService', () => {
  let service: UsersService;
  const gettersMock = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    validateUniqueFields: jest.fn(),
    findByUsername: jest.fn(),
    findOneByIdWithPassword: jest.fn(),
    searchUsersByUsername: jest.fn(),
  };
  const settersMock = {
    remove: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateEmail: jest.fn(),
    updatePassword: jest.fn(),
  };
  const rolesMock = {
    findByCode: jest.fn(),
  };
  const userRolesMock = {
    create: jest.fn(),
  };
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
  const argon2VerifyMock = argon2.verify as jest.MockedFunction<typeof argon2.verify>;
  const generateRandomCodeByLengthMock =
    generateRandomCodeByLength as jest.MockedFunction<
      typeof generateRandomCodeByLength
    >;

  beforeEach(() => {
    jest.clearAllMocks();
    gettersMock.validateUniqueFields.mockResolvedValue(undefined);
    gettersMock.searchUsersByUsername.mockResolvedValue([]);
    generateRandomCodeByLengthMock.mockReturnValue('random-pass-code-twenty');
    service = new UsersService(
      {} as Request,
      {} as Repository<User>,
      settersMock as unknown as UsersSettersService,
      gettersMock as unknown as UsersGettersService,
      rolesMock as unknown as RolesService,
      userRolesMock as unknown as UserRolesService,
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

  describe('create', () => {
    const baseInput = (): CreateUserInput =>
      ({
        username: 'validuser',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'Jane@Test.COM',
        password: 'password1234',
        role: RolesCodesEnum.USER,
      }) as CreateUserInput;

    it('throws when admin cannot assign non-admin role', async () => {
      const data = baseInput();
      await expect(
        service.create(data, ProvidersEnum.LineUp, true),
      ).rejects.toThrow(NotAcceptableException);
    });

    it('throws when username looks like email but differs from email', async () => {
      const data = baseInput();
      data.username = 'a@';
      data.email = 'other@mail.com';
      await expect(
        service.create(data, ProvidersEnum.LineUp),
      ).rejects.toThrow(NotAcceptableException);
    });

    it('throws ForbiddenException when username fails format validation', async () => {
      const data = baseInput();
      data.username = 'bad__name';
      await expect(
        service.create(data, ProvidersEnum.LineUp),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates user, assigns role, and strips password from result', async () => {
      const data = baseInput();
      const created = {
        id: 200,
        username: 'validuser',
        password: 'argon-hashed',
        email: 'jane@test.com',
      } as User;
      settersMock.create.mockResolvedValue(created);
      rolesMock.findByCode.mockResolvedValue({ id: 55 });
      userRolesMock.create.mockResolvedValue(undefined);
      const result = await service.create(data, ProvidersEnum.LineUp);
      expect(settersMock.create).toHaveBeenCalled();
      expect(rolesMock.findByCode).toHaveBeenCalledWith(RolesCodesEnum.USER);
      expect(userRolesMock.create).toHaveBeenCalledWith(
        200,
        55,
        expect.objectContaining({ userId: 200, username: 'validuser' }),
      );
      expect(result.password).toBeUndefined();
      expect(gettersMock.validateUniqueFields).toHaveBeenCalledWith({
        username: 'validuser',
        email: 'jane@test.com',
      });
    });

    it('generates password when omitted and completes flow', async () => {
      const data = {
        firstName: 'No',
        lastName: 'Name',
        email: 'no@name.com',
        password: '',
        role: RolesCodesEnum.USER,
        username: 'nouser',
      } as CreateUserInput;
      gettersMock.searchUsersByUsername.mockResolvedValue([]);
      const created = {
        id: 201,
        username: 'nouser',
        password: 'h',
        email: 'no@name.com',
      } as User;
      settersMock.create.mockResolvedValue(created);
      rolesMock.findByCode.mockResolvedValue({ id: 1 });
      userRolesMock.create.mockResolvedValue(undefined);
      await service.create(data, ProvidersEnum.LineUp);
      expect(generateRandomCodeByLengthMock).toHaveBeenCalled();
      expect(settersMock.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('validates state and image when provided', async () => {
      const current = { id: 10, username: 'self' } as User;
      gettersMock.findOne.mockResolvedValue(current);
      gettersMock.findByUsername.mockResolvedValue(null);
      settersMock.update.mockResolvedValue(current);
      gettersMock.findOne.mockResolvedValueOnce(current).mockResolvedValueOnce({
        ...current,
        firstName: 'X',
      } as User);
      statesMock.findById.mockResolvedValue({ id: 3 });
      filesMock.getImageByName.mockResolvedValue({ name: 'img' });
      await service.update(
        { idState: 3, imageCode: 'avatar-1', username: 'self' },
        userReq,
      );
      expect(statesMock.findById).toHaveBeenCalledWith(3);
      expect(filesMock.getImageByName).toHaveBeenCalledWith('avatar-1');
    });

    it('throws when username belongs to another user', async () => {
      gettersMock.findOne.mockResolvedValue({ id: 10, username: 'self' } as User);
      gettersMock.findByUsername.mockResolvedValue({
        id: 99,
        username: 'taken',
      } as User);
      await expect(
        service.update({ username: 'taken' }, userReq),
      ).rejects.toThrow(NotAcceptableException);
      expect(settersMock.update).not.toHaveBeenCalled();
    });

    it('updates and returns reloaded user', async () => {
      const current = { id: 10, username: 'self' } as User;
      const reloaded = { id: 10, username: 'newname' } as User;
      gettersMock.findOne
        .mockResolvedValueOnce(current)
        .mockResolvedValueOnce(reloaded);
      gettersMock.findByUsername.mockResolvedValue(null);
      settersMock.update.mockResolvedValue(current);
      const result = await service.update({ username: 'newname' }, userReq);
      expect(settersMock.update).toHaveBeenCalled();
      expect(result).toBe(reloaded);
    });
  });

  describe('updateEmail', () => {
    it('throws when validateUniqueFields rejects', async () => {
      gettersMock.findOne.mockResolvedValue({
        id: 10,
        username: 'u',
      } as User);
      gettersMock.validateUniqueFields.mockRejectedValueOnce(
        new NotAcceptableException(),
      );
      const data: UpdateUserEmailInput = { email: 'taken@taken.com' };
      await expect(service.updateEmail(data, userReq)).rejects.toThrow(
        NotAcceptableException,
      );
    });

    it('updates email and returns reloaded user', async () => {
      const u = { id: 10, username: 'self', email: 'old@old.com' } as User;
      const reloaded = { ...u, email: 'fresh@new.com' } as User;
      gettersMock.findOne
        .mockResolvedValueOnce(u)
        .mockResolvedValueOnce(reloaded);
      settersMock.updateEmail.mockResolvedValue(u);
      const data: UpdateUserEmailInput = { email: 'fresh@new.com' };
      const result = await service.updateEmail(data, userReq);
      expect(gettersMock.validateUniqueFields).toHaveBeenCalledWith(
        { username: 'self', email: 'fresh@new.com' },
        userReq.userId,
      );
      expect(result).toBe(reloaded);
    });
  });

  describe('changePassword', () => {
    it('throws ForbiddenException when current password is wrong', async () => {
      gettersMock.findOneByIdWithPassword.mockResolvedValue({
        id: 10,
        password: 'hash',
      } as User);
      argon2VerifyMock.mockResolvedValue(false);
      await expect(
        service.changePassword(
          { currentPassword: 'wrong', newPassword: 'newpass1234' },
          userReq,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotAcceptableException when new password equals old', async () => {
      gettersMock.findOneByIdWithPassword.mockResolvedValue({
        id: 10,
        password: 'same-hash',
      } as User);
      argon2VerifyMock.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
      await expect(
        service.changePassword(
          { currentPassword: 'oldpass12', newPassword: 'oldpass12' },
          userReq,
        ),
      ).rejects.toThrow(NotAcceptableException);
    });

    it('updates password and enqueues notification', async () => {
      gettersMock.findOneByIdWithPassword.mockResolvedValue({
        id: 10,
        password: 'hash',
      } as User);
      argon2VerifyMock.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
      settersMock.updatePassword.mockResolvedValue({} as User);
      notificationsQueueMock.add.mockResolvedValue(undefined);
      await expect(
        service.changePassword(
          { currentPassword: 'okpass1234', newPassword: 'newpass1234' },
          userReq,
        ),
      ).resolves.toBe(true);
      expect(settersMock.updatePassword).toHaveBeenCalledWith(
        expect.objectContaining({ id: 10 }),
        'argon-hashed',
        userReq,
      );
      expect(notificationsQueueMock.add).toHaveBeenCalledWith(
        NotificationsConsumerEnum.CreateForUser,
        expect.objectContaining({
          scenario: NotificationContentScenarioEnum.USER_CHANGE_PASSWORD,
        }),
      );
    });
  });

  describe('generateUsername', () => {
    it('returns slug from names when no collisions', async () => {
      gettersMock.searchUsersByUsername.mockResolvedValue([]);
      const name = await service.generateUsername('Anna', 'Smith');
      expect(name).toBe('anna-smith');
    });

    it('appends numeric suffix when base username collides', async () => {
      gettersMock.searchUsersByUsername.mockResolvedValue([
        { username: 'john-doe' } as User,
      ]);
      const name = await service.generateUsername('John', 'Doe');
      expect(name).toBe('john-doe-01');
    });
  });
});
