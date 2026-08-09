import type { INestApplication } from '@nestjs/common';
import { AuthResolver } from '../src/auth/auth.resolver';
import { AuthService } from '../../../core/modules/auth/auth.service';
import { AuthMailService } from '../../../core/modules/auth/auth-mail.service';
import { executeGraphql } from './helpers/graphql-request.helper';
import { createTestApp } from './helpers/test-app.factory';

describe('Users Auth e2e', () => {
  const authServiceMock = {
    validateUser: jest.fn(),
    loginWithGoogle: jest.fn(),
    registerWithGoogle: jest.fn(),
    setCookies: jest.fn(),
    refreshAndSetCookies: jest.fn(),
    logout: jest.fn(),
  };

  const authMailServiceMock = {
    sendVerificationCodeEmail: jest.fn(),
    verifyCode: jest.fn(),
  };

  const providers = [
    { provide: AuthService, useValue: authServiceMock },
    { provide: AuthMailService, useValue: authMailServiceMock },
  ];

  const loginMutation = `
    mutation Login($login: LoginDto!) {
      login(login: $login) {
        status
        message
        code
      }
    }
  `;

  const logoutMutation = `
    mutation Logout {
      logout {
        status
        message
        code
      }
    }
  `;

  const sendVerificationCodeMutation = `
    mutation SendVerificationCode($data: SendVerificationCodeInput!) {
      sendVerificationCode(data: $data) {
        status
        message
        code
      }
    }
  `;

  const loginWithGoogleMutation = `
    mutation LoginWithGoogle($data: LoginGoogleInput!) {
      loginWithGoogle(data: $data) {
        status
        message
        code
      }
    }
  `;

  const registerWithGoogleMutation = `
    mutation RegisterWithGoogle($data: RegisterGoogleInput!) {
      registerWithGoogle(data: $data) {
        status
        message
        code
      }
    }
  `;

  const refreshTokenMutation = `
    mutation RefreshToken {
      refreshToken {
        status
        message
        code
      }
    }
  `;

  const verifyCodeMutation = `
    mutation VerifyCode($data: VerifyCodeInput!) {
      verifyCode(data: $data) {
        status
        message
        code
      }
    }
  `;

  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({
      resolvers: [AuthResolver],
      providers,
    });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('executes login mutation on /graphql', async () => {
    authServiceMock.validateUser.mockResolvedValue({
      token: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 1 },
      status: true,
      message: 'Login success',
      code: 200,
    });
    authServiceMock.setCookies.mockResolvedValue({
      status: true,
      message: 'Login success',
      code: 200,
    });

    const response = await executeGraphql({
      app,
      query: loginMutation,
      variables: {
        login: {
          email: 'demo@lineup.com',
          password: 'SecurePassword123',
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.login).toEqual({
      status: true,
      message: 'Login success',
      code: 200,
    });
    expect(authServiceMock.validateUser).toHaveBeenCalledTimes(1);
    expect(authServiceMock.setCookies).toHaveBeenCalledTimes(1);
  });

  it('rejects logout when auth guard blocks the request', async () => {
    await app.close();
    app = await createTestApp({
      resolvers: [AuthResolver],
      providers,
      guardOverrides: {
        jwt: {
          allow: false,
        },
      },
    });

    const response = await executeGraphql({
      app,
      query: logoutMutation,
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toBeNull();
    expect(response.body.errors).toBeDefined();
  });

  it('executes verification code flow mutation', async () => {
    authMailServiceMock.sendVerificationCodeEmail.mockResolvedValue(undefined);

    const response = await executeGraphql({
      app,
      query: sendVerificationCodeMutation,
      variables: {
        data: {
          email: 'demo@lineup.com',
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.sendVerificationCode.status).toBe(true);
    expect(authMailServiceMock.sendVerificationCodeEmail).toHaveBeenCalledWith(
      'demo@lineup.com',
    );
  });

  it('executes loginWithGoogle mutation', async () => {
    authServiceMock.loginWithGoogle.mockResolvedValue({
      token: 'access-token',
      refreshToken: 'refresh-token',
      status: true,
      message: 'Google login success',
      code: 200,
    });
    authServiceMock.setCookies.mockResolvedValue({
      status: true,
      message: 'Google login success',
      code: 200,
    });

    const response = await executeGraphql({
      app,
      query: loginWithGoogleMutation,
      variables: {
        data: {
          token: 'google-id-token',
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.loginWithGoogle.status).toBe(true);
    expect(authServiceMock.loginWithGoogle).toHaveBeenCalledTimes(1);
    expect(authServiceMock.setCookies).toHaveBeenCalledTimes(1);
  });

  it('executes registerWithGoogle mutation', async () => {
    authServiceMock.registerWithGoogle.mockResolvedValue({
      token: 'access-token',
      refreshToken: 'refresh-token',
      status: true,
      message: 'Google register success',
      code: 201,
    });
    authServiceMock.setCookies.mockResolvedValue({
      status: true,
      message: 'Google register success',
      code: 201,
    });

    const response = await executeGraphql({
      app,
      query: registerWithGoogleMutation,
      variables: {
        data: {
          token: 'google-id-token',
          role: 'USER',
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.registerWithGoogle.status).toBe(true);
    expect(authServiceMock.registerWithGoogle).toHaveBeenCalledTimes(1);
    expect(authServiceMock.setCookies).toHaveBeenCalledTimes(1);
  });

  it('executes refreshToken mutation', async () => {
    authServiceMock.refreshAndSetCookies.mockResolvedValue({
      status: true,
      message: 'Token refreshed',
      code: 200,
    });

    const response = await executeGraphql({
      app,
      query: refreshTokenMutation,
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.refreshToken.status).toBe(true);
    expect(authServiceMock.refreshAndSetCookies).toHaveBeenCalledTimes(1);
  });

  it('executes verifyCode mutation', async () => {
    authMailServiceMock.verifyCode.mockResolvedValue(undefined);

    const response = await executeGraphql({
      app,
      query: verifyCodeMutation,
      variables: {
        data: {
          email: 'demo@lineup.com',
          code: '123456',
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.verifyCode.status).toBe(true);
    expect(authMailServiceMock.verifyCode).toHaveBeenCalledWith(
      'demo@lineup.com',
      '123456',
    );
  });
});
