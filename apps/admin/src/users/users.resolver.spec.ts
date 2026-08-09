import { UsersResolver } from './users.resolver';
import { UsersService } from '../../../../core/modules/users/users.service';
import { ProvidersEnum, RolesCodesEnum } from '../../../../core/common/enums';
import type { User } from '../../../../core/entities';
import type { IUserReq } from '../../../../core/common/interfaces';
import { InfinityScrollInput } from '../../../../core/common/dtos';

/**
 * Unit tests for {@link UsersResolver}.
 */
describe('UsersResolver', () => {
  let resolver: UsersResolver;
  const usersServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const adminUser: IUserReq = { userId: 99, username: 'admin' };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new UsersResolver(usersServiceMock as unknown as UsersService);
  });

  describe('createUser', () => {
    it('creates via UsersService with LineUp admin flag', async () => {
      const data = {
        firstName: 'A',
        lastName: 'B',
        email: 'a@a.com',
        password: 'p',
        role: RolesCodesEnum.USER,
      } as never;
      const created = { id: 1, firstName: 'A' } as User;
      usersServiceMock.create.mockResolvedValue(created);
      const result = await resolver.createUser(data);
      expect(usersServiceMock.create).toHaveBeenCalledWith(
        data,
        ProvidersEnum.LineUp,
        true,
      );
      expect(result).toEqual(created);
    });
  });

  describe('findAllUsers', () => {
    it('maps users to schema and returns pagination envelope', async () => {
      const pagination = { page: 1, limit: 10 } as InfinityScrollInput;
      const users = [{ id: 1 }, { id: 2 }] as User[];
      usersServiceMock.findAll.mockResolvedValue(users);
      const result = await resolver.findAllUsers(pagination);
      expect(usersServiceMock.findAll).toHaveBeenCalledWith(pagination);
      expect(result.items).toEqual(users);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('findOneUser', () => {
    it('delegates to findOne', async () => {
      const u = { id: 5 } as User;
      usersServiceMock.findOne.mockResolvedValue(u);
      await expect(resolver.findOneUser(5)).resolves.toEqual(u);
    });
  });

  describe('me', () => {
    it('loads current user by id from token', async () => {
      const u = { id: 99, username: 'admin' } as User;
      usersServiceMock.findOne.mockResolvedValue(u);
      await expect(resolver.me(adminUser)).resolves.toEqual(u);
      expect(usersServiceMock.findOne).toHaveBeenCalledWith(99);
    });
  });

  describe('updateUser', () => {
    it('delegates to usersService.update', async () => {
      const data = { firstName: 'New' } as never;
      const updated = { id: 99, firstName: 'New' } as User;
      usersServiceMock.update.mockResolvedValue(updated);
      const result = await resolver.updateUser(data, adminUser);
      expect(usersServiceMock.update).toHaveBeenCalledWith(data, adminUser);
      expect(result).toEqual(updated);
    });
  });

  describe('removeUser', () => {
    it('delegates to remove and returns true', async () => {
      usersServiceMock.remove.mockResolvedValue(undefined);
      await expect(resolver.removeUser(3, adminUser)).resolves.toBe(true);
      expect(usersServiceMock.remove).toHaveBeenCalledWith(3, adminUser);
    });
  });
});
