import type { INestApplication } from '@nestjs/common';
import { RolesAdminResolver } from '../src/roles-admin/roles-admin.resolver';
import { UserRolesService } from '../../../core/modules/user-roles/user-roles.service';
import { BusinessRolesService } from '../../../core/modules/business-roles/business-roles.service';
import { RolesService } from '../../../core/modules/roles/roles.service';
import { UsersGettersService } from '../../../core/modules/users/users.getters.service';
import { BusinessesGettersService } from '../../../core/modules/businesses/businesses-getters.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Admin RolesAdmin e2e', () => {
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

  const providers = [
    { provide: UserRolesService, useValue: userRolesServiceMock },
    { provide: BusinessRolesService, useValue: businessRolesServiceMock },
    { provide: RolesService, useValue: rolesServiceMock },
    { provide: UsersGettersService, useValue: usersGettersServiceMock },
    { provide: BusinessesGettersService, useValue: businessesGettersServiceMock },
  ];

  const assignRoleToUserMutation = `
    mutation AssignRoleToUser($data: AssignRoleToUserInput!) {
      assignRoleToUser(data: $data) { id }
    }
  `;
  const assignRoleToBusinessMutation = `
    mutation AssignRoleToBusiness($data: AssignRoleToBusinessInput!) {
      assignRoleToBusiness(data: $data) { id }
    }
  `;
  const removeRoleFromUserMutation = `
    mutation RemoveRoleFromUser($data: RemoveRoleFromUserInput!) {
      removeRoleFromUser(data: $data)
    }
  `;
  const removeRoleFromBusinessMutation = `
    mutation RemoveRoleFromBusiness($data: RemoveRoleFromBusinessInput!) {
      removeRoleFromBusiness(data: $data)
    }
  `;
  const getAllRolesQuery = `
    query GetAllRoles { getAllRoles { id } }
  `;
  const getRolesByUserQuery = `
    query GetRolesByUser($idUser: Int!) { getRolesByUser(idUser: $idUser) { id } }
  `;
  const getRolesByBusinessQuery = `
    query GetRolesByBusiness($idBusiness: Int!) { getRolesByBusiness(idBusiness: $idBusiness) { id } }
  `;

  let app: INestApplication;
  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({ resolvers: [RolesAdminResolver], providers });
  });
  afterEach(async () => {
    if (app) await app.close();
  });

  it('covers assignRoleToUser', async () => {
    usersGettersServiceMock.findOne.mockResolvedValue({ id: 1 });
    rolesServiceMock.findOneOrFail.mockResolvedValue({ id: 1 });
    userRolesServiceMock.create.mockResolvedValue(undefined);
    const response = await executeGraphql({
      app,
      query: assignRoleToUserMutation,
      variables: { data: { idUser: 1, idRole: 1 } },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.assignRoleToUser.id).toBe(1);
  });

  it('covers assignRoleToBusiness', async () => {
    businessesGettersServiceMock.findOne.mockResolvedValue({ id: 1 });
    rolesServiceMock.findOneOrFail.mockResolvedValue({ id: 1 });
    businessRolesServiceMock.create.mockResolvedValue(undefined);
    const response = await executeGraphql({
      app,
      query: assignRoleToBusinessMutation,
      variables: { data: { idBusiness: 1, idRole: 1 } },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.assignRoleToBusiness.id).toBe(1);
  });

  it('covers removeRoleFromUser', async () => {
    usersGettersServiceMock.findOne.mockResolvedValue({ id: 1 });
    rolesServiceMock.findOneOrFail.mockResolvedValue({ id: 1 });
    userRolesServiceMock.removeUserRole.mockResolvedValue(undefined);
    const response = await executeGraphql({
      app,
      query: removeRoleFromUserMutation,
      variables: { data: { idUser: 1, idRole: 1 } },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.removeRoleFromUser).toBe(true);
  });

  it('covers removeRoleFromBusiness', async () => {
    businessesGettersServiceMock.findOne.mockResolvedValue({ id: 1 });
    rolesServiceMock.findOneOrFail.mockResolvedValue({ id: 1 });
    businessRolesServiceMock.removeBusinessRole.mockResolvedValue(undefined);
    const response = await executeGraphql({
      app,
      query: removeRoleFromBusinessMutation,
      variables: { data: { idBusiness: 1, idRole: 1 } },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.removeRoleFromBusiness).toBe(true);
  });

  it('covers getAllRoles', async () => {
    rolesServiceMock.getAll.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({ app, query: getAllRolesQuery });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.getAllRoles).toHaveLength(1);
  });

  it('covers getRolesByUser', async () => {
    usersGettersServiceMock.findOne.mockResolvedValue({ id: 1 });
    userRolesServiceMock.findAllByUserId.mockResolvedValue([{ role: { id: 1 } }]);
    const response = await executeGraphql({
      app,
      query: getRolesByUserQuery,
      variables: { idUser: 1 },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.getRolesByUser).toHaveLength(1);
  });

  it('covers getRolesByBusiness', async () => {
    businessesGettersServiceMock.findOne.mockResolvedValue({ id: 1 });
    businessRolesServiceMock.findAllByBusinessId.mockResolvedValue([
      { role: { id: 1 } },
    ]);
    const response = await executeGraphql({
      app,
      query: getRolesByBusinessQuery,
      variables: { idBusiness: 1 },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.getRolesByBusiness).toHaveLength(1);
  });
});
