import type { INestApplication } from '@nestjs/common';
import { VerificationCodesResolver } from '../src/verification-codes/verification-codes.resolver';
import { VerificationCodesService } from '../../../core/modules/verification-codes/verification-codes.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Businesses VerificationCodes e2e', () => {
  const verificationCodesServiceMock = {
    createVerificationCode: jest.fn(),
    verifyCode: jest.fn(),
  };
  const providers = [
    { provide: VerificationCodesService, useValue: verificationCodesServiceMock },
  ];

  const sendBusinessVerificationCodeMutation = `mutation SendBusinessVerificationCode($data: CreateVerificationCodeDto!) { sendBusinessVerificationCode(data: $data) { status } }`;
  const verifyBusinessVerificationCodeMutation = `mutation VerifyBusinessVerificationCode($data: VerifyVerificationCodeDto!) { verifyBusinessVerificationCode(data: $data) { status } }`;

  let app: INestApplication;
  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({
      resolvers: [VerificationCodesResolver],
      providers,
    });
  });
  afterEach(async () => {
    if (app) await app.close();
  });

  it('covers sendBusinessVerificationCode', async () => {
    verificationCodesServiceMock.createVerificationCode.mockResolvedValue(undefined);
    const response = await executeGraphql({
      app,
      query: sendBusinessVerificationCodeMutation,
      variables: { data: { channel: 'EMAIL' } },
    });
    expect(response.body.data.sendBusinessVerificationCode.status).toBe(true);
  });
  it('covers verifyBusinessVerificationCode', async () => {
    verificationCodesServiceMock.verifyCode.mockResolvedValue(undefined);
    const response = await executeGraphql({
      app,
      query: verifyBusinessVerificationCodeMutation,
      variables: { data: { code: '123456' } },
    });
    expect(response.body.data.verifyBusinessVerificationCode.status).toBe(true);
  });
});
