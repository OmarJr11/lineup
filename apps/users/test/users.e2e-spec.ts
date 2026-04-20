import type { INestApplication } from '@nestjs/common';
import { UsersResolver } from '../src/users/users.resolver';
import { UsersService } from '../../../core/modules/users/users.service';
import { TokensService } from '../../../core/modules/token/token.service';
import { AuthService } from '../../../core/modules/auth/auth.service';
import { executeGraphql } from './helpers/graphql-request.helper';
import { createTestApp } from './helpers/test-app.factory';

describe('Users UsersResolver e2e', () => {
  const usersServiceMock = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateEmail: jest.fn(),
    changePassword: jest.fn(),
    remove: jest.fn(),
  };

  const tokensServiceMock = {
    generateTokens: jest.fn(),
  };

  const authServiceMock = {
    setCookies: jest.fn(),
  };

  const providers = [
    { provide: UsersService, useValue: usersServiceMock },
    { provide: TokensService, useValue: tokensServiceMock },
    { provide: AuthService, useValue: authServiceMock },
  ];

  const createUserMutation = `
    mutation CreateUser($data: CreateUserInput!) {
      createUser(data: $data) {
        status
        message
        code
      }
    }
  `;

  const userByIdQuery = `
    query UserById($id: Int!) {
      userById(id: $id) {
        id
        email
      }
    }
  `;

  const meQuery = `
    query Me {
      me {
        id
        email
        username
        firstName
        lastName
        status
        provider
      }
    }
  `;

  const updateUserMutation = `
    mutation UpdateUser($data: UpdateUserInput!) {
      updateUser(data: $data) {
        id
        firstName
        lastName
      }
    }
  `;

  const updateUserEmailMutation = `
    mutation UpdateUserEmail($data: UpdateUserEmailInput!) {
      updateUserEmail(data: $data) {
        id
        email
      }
    }
  `;

  const changePasswordMutation = `
    mutation ChangePassword($data: ChangePasswordInput!) {
      changePassword(data: $data)
    }
  `;

  const removeUserMutation = `
    mutation RemoveUser {
      removeUser
    }
  `;

  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({
      resolvers: [UsersResolver],
      providers,
    });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('creates a user and sets cookies through createUser mutation', async () => {
    usersServiceMock.create.mockResolvedValue({
      id: 1,
      email: 'demo@lineup.com',
      username: 'lineup-user',
      firstName: 'Line',
      lastName: 'Up',
      status: 'active',
      provider: 'lineup',
    });
    tokensServiceMock.generateTokens.mockResolvedValue({
      token: 'access-token',
      refreshToken: 'refresh-token',
    });
    authServiceMock.setCookies.mockResolvedValue({
      status: true,
      message: 'User created',
      code: 201,
    });

    const response = await executeGraphql({
      app,
      query: createUserMutation,
      variables: {
        data: {
          firstName: 'Line',
          lastName: 'Up',
          email: 'demo@lineup.com',
          password: 'SecurePassword123',
          role: 'USER',
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createUser.status).toBe(true);
    expect(usersServiceMock.create).toHaveBeenCalledTimes(1);
    expect(tokensServiceMock.generateTokens).toHaveBeenCalledTimes(1);
    expect(authServiceMock.setCookies).toHaveBeenCalledTimes(1);
  });

  it('resolves userById query', async () => {
    usersServiceMock.findOne.mockResolvedValue({
      id: 10,
      email: 'user10@lineup.com',
    });

    const response = await executeGraphql({
      app,
      query: userByIdQuery,
      variables: {
        id: 10,
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.userById.id).toBe(10);
    expect(usersServiceMock.findOne).toHaveBeenCalledWith(10);
  });

  it('resolves me query for authenticated user', async () => {
    usersServiceMock.findOne.mockResolvedValue({
      id: 1,
      email: 'demo@lineup.com',
      username: 'lineup-user',
      firstName: 'Line',
      lastName: 'Up',
      status: 'active',
      provider: 'lineup',
    });

    const response = await executeGraphql({
      app,
      query: meQuery,
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.me.email).toBe('demo@lineup.com');
    expect(usersServiceMock.findOne).toHaveBeenCalledWith(1);
  });

  it('updates current user profile', async () => {
    usersServiceMock.update.mockResolvedValue({
      id: 1,
      firstName: 'Updated',
      lastName: 'User',
    });

    const response = await executeGraphql({
      app,
      query: updateUserMutation,
      variables: {
        data: {
          firstName: 'Updated',
          lastName: 'User',
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.updateUser.firstName).toBe('Updated');
    expect(usersServiceMock.update).toHaveBeenCalledTimes(1);
  });

  it('updates current user email', async () => {
    usersServiceMock.updateEmail.mockResolvedValue({
      id: 1,
      email: 'updated@lineup.com',
    });

    const response = await executeGraphql({
      app,
      query: updateUserEmailMutation,
      variables: {
        data: {
          email: 'updated@lineup.com',
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.updateUserEmail.email).toBe('updated@lineup.com');
    expect(usersServiceMock.updateEmail).toHaveBeenCalledTimes(1);
  });

  it('changes password for authenticated user', async () => {
    usersServiceMock.changePassword.mockResolvedValue(true);

    const response = await executeGraphql({
      app,
      query: changePasswordMutation,
      variables: {
        data: {
          currentPassword: 'OldPassword123',
          newPassword: 'NewPassword123',
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.changePassword).toBe(true);
    expect(usersServiceMock.changePassword).toHaveBeenCalledTimes(1);
  });

  it('removes current user account', async () => {
    usersServiceMock.remove.mockResolvedValue(undefined);

    const response = await executeGraphql({
      app,
      query: removeUserMutation,
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.removeUser).toBe(true);
    expect(usersServiceMock.remove).toHaveBeenCalledTimes(1);
  });
});
