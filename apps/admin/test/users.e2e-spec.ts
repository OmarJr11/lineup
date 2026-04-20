import type { INestApplication } from '@nestjs/common';
import { UsersResolver } from '../src/users/users.resolver';
import { UsersService } from '../../../core/modules/users/users.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Admin Users e2e', () => {
  const usersServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const providers = [{ provide: UsersService, useValue: usersServiceMock }];

  const createUserMutation = `
    mutation CreateUser($data: CreateUserInput!) {
      createUser(data: $data) { id }
    }
  `;
  const findAllUsersQuery = `
    query FindAllUsers($pagination: InfinityScrollInput!) {
      findAllUsers(pagination: $pagination) { total }
    }
  `;
  const findOneUserQuery = `
    query FindOneUser($id: Int!) {
      findOneUser(id: $id) { id }
    }
  `;
  const meQuery = `
    query Me { me { id } }
  `;
  const updateUserMutation = `
    mutation UpdateUser($data: UpdateUserInput!) {
      updateUser(data: $data) { id }
    }
  `;
  const removeUserMutation = `
    mutation RemoveUser($id: Int!) {
      removeUser(id: $id)
    }
  `;

  let app: INestApplication;
  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({ resolvers: [UsersResolver], providers });
  });
  afterEach(async () => {
    if (app) await app.close();
  });

  it('covers createUser', async () => {
    usersServiceMock.create.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: createUserMutation,
      variables: {
        data: {
          firstName: 'Admin',
          lastName: 'User',
          email: 'u@lineup.com',
          password: 'Secret123',
          role: 'USER',
        },
      },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createUser.id).toBe(1);
  });

  it('covers findAllUsers', async () => {
    usersServiceMock.findAll.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({
      app,
      query: findAllUsersQuery,
      variables: { pagination: { page: 1, limit: 10 } },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.findAllUsers.total).toBe(1);
  });

  it('covers findOneUser', async () => {
    usersServiceMock.findOne.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: findOneUserQuery,
      variables: { id: 1 },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.findOneUser.id).toBe(1);
  });

  it('covers me', async () => {
    usersServiceMock.findOne.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({ app, query: meQuery });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.me.id).toBe(1);
  });

  it('covers updateUser', async () => {
    usersServiceMock.update.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: updateUserMutation,
      variables: { data: { firstName: 'Updated' } },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.updateUser.id).toBe(1);
  });

  it('covers removeUser', async () => {
    usersServiceMock.remove.mockResolvedValue(undefined);
    const response = await executeGraphql({
      app,
      query: removeUserMutation,
      variables: { id: 1 },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.removeUser).toBe(true);
  });
});
