import type { INestApplication } from '@nestjs/common';
import { AuthResolver } from '../src/auth/auth.resolver';
import { AuthService } from '../../../core/modules/auth/auth.service';
import { AuthMailService } from '../../../core/modules/auth/auth-mail.service';
import { executeGraphql } from './helpers/graphql-request.helper';
import { createTestApp } from './helpers/test-app.factory';

describe('Businesses Auth e2e', () => {
  const authServiceMock = {
    validateBusiness: jest.fn(),
    loginWithGoogleBusiness: jest.fn(),
    registerWithGoogleBusiness: jest.fn(),
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
      }
    }
  `;
  const loginWithGoogleMutation = `
    mutation LoginWithGoogle($data: LoginGoogleInput!) {
      loginWithGoogle(data: $data) {
        status
      }
    }
  `;
  const registerWithGoogleMutation = `
    mutation RegisterWithGoogle($data: RegisterGoogleBusinessInput!) {
      registerWithGoogle(data: $data) {
        status
      }
    }
  `;
  const refreshTokenMutation = `
    mutation RefreshToken {
      refreshToken {
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
  const sendVerificationCodeMutation = `
    mutation SendVerificationCode($data: SendVerificationCodeInput!) {
      sendVerificationCode(data: $data) {
        status
      }
    }
  `;
  const verifyCodeMutation = `
    mutation VerifyCode($data: VerifyCodeInput!) {
      verifyCode(data: $data) {
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
    if (app) {
      await app.close();
    }
  });

  it('covers login', async () => {
    authServiceMock.validateBusiness.mockResolvedValue({
      token: 'a',
      refreshToken: 'b',
      status: true,
    });
    authServiceMock.setCookies.mockResolvedValue({ status: true });
    const response = await executeGraphql({
      app,
      query: loginMutation,
      variables: { login: { email: 'b@b.com', password: 'secret' } },
    });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.login.status).toBe(true);
  });

  it('covers loginWithGoogle', async () => {
    authServiceMock.loginWithGoogleBusiness.mockResolvedValue({
      token: 'a',
      refreshToken: 'b',
      status: true,
    });
    authServiceMock.setCookies.mockResolvedValue({ status: true });
    const response = await executeGraphql({
      app,
      query: loginWithGoogleMutation,
      variables: { data: { token: 'google-token' } },
    });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.loginWithGoogle.status).toBe(true);
  });

  it('covers registerWithGoogle', async () => {
    authServiceMock.registerWithGoogleBusiness.mockResolvedValue({
      token: 'a',
      refreshToken: 'b',
      status: true,
    });
    authServiceMock.setCookies.mockResolvedValue({ status: true });
    const response = await executeGraphql({
      app,
      query: registerWithGoogleMutation,
      variables: { data: { token: 'google-token' } },
    });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.registerWithGoogle.status).toBe(true);
  });

  it('covers refreshToken', async () => {
    authServiceMock.refreshAndSetCookies.mockResolvedValue({ status: true });
    const response = await executeGraphql({ app, query: refreshTokenMutation });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.refreshToken.status).toBe(true);
  });

  it('covers logout', async () => {
    authServiceMock.logout.mockResolvedValue({ status: true });
    const response = await executeGraphql({ app, query: logoutMutation });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.logout.status).toBe(true);
  });

  it('covers sendVerificationCode', async () => {
    authMailServiceMock.sendVerificationCodeEmail.mockResolvedValue(undefined);
    const response = await executeGraphql({
      app,
      query: sendVerificationCodeMutation,
      variables: { data: { email: 'biz@lineup.com' } },
    });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.sendVerificationCode.status).toBe(true);
  });

  it('covers verifyCode', async () => {
    authMailServiceMock.verifyCode.mockResolvedValue(undefined);
    const response = await executeGraphql({
      app,
      query: verifyCodeMutation,
      variables: { data: { email: 'biz@lineup.com', code: '123456' } },
    });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.verifyCode.status).toBe(true);
  });
});
