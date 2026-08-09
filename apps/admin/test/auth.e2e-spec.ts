import type { INestApplication } from '@nestjs/common';
import { AuthResolver } from '../src/auth/auth.resolver';
import { AuthService } from '../../../core/modules/auth/auth.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Admin Auth e2e', () => {
  const authServiceMock = {
    validateUser: jest.fn(),
    setCookies: jest.fn(),
    logout: jest.fn(),
  };

  const providers = [{ provide: AuthService, useValue: authServiceMock }];

  const loginMutation = `
    mutation Login($login: LoginDto!) {
      login(login: $login) {
        status
      }
    }
  `;
  const logoutMutation = `
    mutation Logout {
      logout {
        status
      }
    }
  `;

  let app: INestApplication;
  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({ resolvers: [AuthResolver], providers });
  });
  afterEach(async () => {
    if (app) await app.close();
  });

  it('covers login mutation', async () => {
    authServiceMock.validateUser.mockResolvedValue({
      token: 'a',
      refreshToken: 'b',
      status: true,
    });
    authServiceMock.setCookies.mockResolvedValue({ status: true });
    const response = await executeGraphql({
      app,
      query: loginMutation,
      variables: { login: { email: 'admin@lineup.com', password: 'Secret123' } },
    });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.login.status).toBe(true);
  });

  it('covers logout mutation', async () => {
    authServiceMock.logout.mockResolvedValue({ status: true });
    const response = await executeGraphql({ app, query: logoutMutation });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.logout.status).toBe(true);
  });
});
