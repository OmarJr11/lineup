import { RolesAdminResolver } from './roles-admin.resolver';
import { UserRolesService } from '../../../../core/modules/user-roles/user-roles.service';
import { BusinessRolesService } from '../../../../core/modules/business-roles/business-roles.service';
import { RolesService } from '../../../../core/modules/roles/roles.service';
import { UsersGettersService } from '../../../../core/modules/users/users.getters.service';
import { BusinessesGettersService } from '../../../../core/modules/businesses/businesses-getters.service';
import type { Role } from '../../../../core/entities';
import type { IUserReq } from '../../../../core/common/interfaces';
import type {
  AssignRoleToBusinessInput,
  AssignRoleToUserInput,
} from '../../../../core/common/dtos';

/**
 * Unit tests for {@link RolesAdminResolver}.
 */
describe('RolesAdminResolver', () => {
  let resolver: RolesAdminResolver;
  const userRolesServiceMock = {
    create: jest.fn(),
    removeUserRole: jest.fn(),
    findAllByUserId: jest.fn(),
  };
  const businessRolesServiceMock = {
    create: jest.fn(),
    removeBusinessRole: jest.fn(),
    findAllByBusinessId: jest.fn(),
  };
  const rolesServiceMock = {
    findOneOrFail: jest.fn(),
    getAll: jest.fn(),
  };
  const usersGettersServiceMock = {
    findOne: jest.fn(),
  };
  const businessesGettersServiceMock = {
    findOne: jest.fn(),
  };
  const admin: IUserReq = { userId: 1, username: 'admin' };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new RolesAdminResolver(
      userRolesServiceMock as unknown as UserRolesService,
      businessRolesServiceMock as unknown as BusinessRolesService,
      rolesServiceMock as unknown as RolesService,
      usersGettersServiceMock as unknown as UsersGettersService,
      businessesGettersServiceMock as unknown as BusinessesGettersService,
    );
  });

  describe('assignRoleToUser', () => {
    it('loads user and role, assigns, and returns role schema', async () => {
      const data: AssignRoleToUserInput = { idUser: 10, idRole: 2 };
      const roleEntity = { id: 2, code: '02USERLUP' } as unknown as Role;
      usersGettersServiceMock.findOne.mockResolvedValue({ id: 10 });
      rolesServiceMock.findOneOrFail.mockResolvedValue(roleEntity);
      userRolesServiceMock.create.mockResolvedValue(undefined);
      const result = await resolver.assignRoleToUser(data, admin);
      expect(usersGettersServiceMock.findOne).toHaveBeenCalledWith(10);
      expect(userRolesServiceMock.create).toHaveBeenCalledWith(10, 2, admin);
      expect(result).toMatchObject({ id: 2, code: '02USERLUP' });
    });
  });

  describe('getAllRoles', () => {
    it('maps roles through toRoleSchema', async () => {
      const roles = [{ id: 1, code: 'A' } as unknown as Role];
      rolesServiceMock.getAll.mockResolvedValue(roles);
      const result = await resolver.getAllRoles();
      expect(rolesServiceMock.getAll).toHaveBeenCalled();
      expect(result).toEqual([{ id: 1, code: 'A' }]);
    });
  });

  describe('getRolesByUser', () => {
    it('returns roles linked to the user', async () => {
      usersGettersServiceMock.findOne.mockResolvedValue({ id: 5 });
      userRolesServiceMock.findAllByUserId.mockResolvedValue([
        { role: { id: 9, code: 'R' } as unknown as Role },
      ]);
      const result = await resolver.getRolesByUser(5);
      expect(userRolesServiceMock.findAllByUserId).toHaveBeenCalledWith(5);
      expect(result).toEqual([{ id: 9, code: 'R' }]);
    });
  });

  describe('assignRoleToBusiness', () => {
    it('loads business and role, assigns, and returns role schema', async () => {
      const data: AssignRoleToBusinessInput = { idBusiness: 7, idRole: 3 };
      const roleEntity = { id: 3, code: '05BUSSLUP' } as unknown as Role;
      businessesGettersServiceMock.findOne.mockResolvedValue({ id: 7 });
      rolesServiceMock.findOneOrFail.mockResolvedValue(roleEntity);
      businessRolesServiceMock.create.mockResolvedValue(undefined);
      const result = await resolver.assignRoleToBusiness(data, admin);
      expect(businessesGettersServiceMock.findOne).toHaveBeenCalledWith(7);
      expect(businessRolesServiceMock.create).toHaveBeenCalledWith(7, 3, admin);
      expect(result).toMatchObject({ id: 3 });
    });
  });

  describe('getRolesByBusiness', () => {
    it('returns roles linked to the business', async () => {
      businessesGettersServiceMock.findOne.mockResolvedValue({ id: 8 });
      businessRolesServiceMock.findAllByBusinessId.mockResolvedValue([
        { role: { id: 1, code: 'X' } as unknown as Role },
      ]);
      const result = await resolver.getRolesByBusiness(8);
      expect(businessRolesServiceMock.findAllByBusinessId).toHaveBeenCalledWith(
        8,
      );
      expect(result).toEqual([{ id: 1, code: 'X' }]);
    });
  });

  describe('removeRoleFromBusiness', () => {
    it('delegates to removeBusinessRole', async () => {
      businessesGettersServiceMock.findOne.mockResolvedValue({ id: 4 });
      rolesServiceMock.findOneOrFail.mockResolvedValue({ id: 2 });
      businessRolesServiceMock.removeBusinessRole.mockResolvedValue(undefined);
      await expect(
        resolver.removeRoleFromBusiness(
          { idBusiness: 4, idRole: 2 },
          admin,
        ),
      ).resolves.toBe(true);
      expect(businessRolesServiceMock.removeBusinessRole).toHaveBeenCalledWith(
        4,
        2,
        admin,
      );
    });
  });

  describe('removeRoleFromUser', () => {
    it('delegates to userRolesService.removeUserRole', async () => {
      usersGettersServiceMock.findOne.mockResolvedValue({ id: 3 });
      rolesServiceMock.findOneOrFail.mockResolvedValue({ id: 2 });
      userRolesServiceMock.removeUserRole.mockResolvedValue(undefined);
      await expect(
        resolver.removeRoleFromUser({ idUser: 3, idRole: 2 }, admin),
      ).resolves.toBe(true);
      expect(userRolesServiceMock.removeUserRole).toHaveBeenCalledWith(
        3,
        2,
        admin,
      );
    });
  });
});
