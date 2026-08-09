import type { INestApplication } from '@nestjs/common';
import { VerificationCodesResolver } from '../src/verification-codes/verification-codes.resolver';
import { VerificationCodesService } from '../../../core/modules/verification-codes/verification-codes.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Users VerificationCodes e2e', () => {
  const verificationCodesServiceMock = {
    createVerificationCode: jest.fn(),
    verifyCode: jest.fn(),
  };

  const providers = [
    {
      provide: VerificationCodesService,
      useValue: verificationCodesServiceMock,
    },
  ];

  const sendUserVerificationCodeMutation = `
    mutation SendUserVerificationCode($data: CreateVerificationCodeDto!) {
      sendUserVerificationCode(data: $data) {
        status
        message
        code
      }
    }
  `;

  const verifyUserVerificationCodeMutation = `
    mutation VerifyUserVerificationCode($data: VerifyVerificationCodeDto!) {
      verifyUserVerificationCode(data: $data) {
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
      resolvers: [VerificationCodesResolver],
      providers,
    });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('sends a user verification code', async () => {
    verificationCodesServiceMock.createVerificationCode.mockResolvedValue(
      undefined,
    );

    const response = await executeGraphql({
      app,
      query: sendUserVerificationCodeMutation,
      variables: {
        data: {
          channel: 'EMAIL',
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.sendUserVerificationCode.status).toBe(true);
  });

  it('verifies a user verification code', async () => {
    verificationCodesServiceMock.verifyCode.mockResolvedValue(undefined);

    const response = await executeGraphql({
      app,
      query: verifyUserVerificationCodeMutation,
      variables: {
        data: {
          code: '123456',
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.verifyUserVerificationCode.status).toBe(true);
  });
});
