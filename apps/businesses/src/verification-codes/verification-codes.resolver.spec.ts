import { VerificationCodesResolver } from './verification-codes.resolver';
import { VerificationCodesService } from '../../../../core/modules/verification-codes/verification-codes.service';
import { businessesResponses } from '../../../../core/common/responses';
import type { CreateVerificationCodeDto } from '../../../../core/modules/verification-codes/dto/create-verification-code.dto';
import type { VerifyVerificationCodeDto } from '../../../../core/modules/verification-codes/dto/verify-verification-code.dto';
import type { IBusinessReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link VerificationCodesResolver}.
 */
describe('VerificationCodesResolver', () => {
  let resolver: VerificationCodesResolver;
  const verificationCodesServiceMock = {
    createVerificationCode: jest.fn(),
    verifyCode: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new VerificationCodesResolver(
      verificationCodesServiceMock as unknown as VerificationCodesService,
    );
  });

  it('sendBusinessVerificationCode returns success response', async () => {
    const data = {} as CreateVerificationCodeDto;
    const business = { businessId: 1 } as IBusinessReq;
    verificationCodesServiceMock.createVerificationCode.mockResolvedValue(
      undefined,
    );
    const out = await resolver.sendBusinessVerificationCode(data, business);
    expect(
      verificationCodesServiceMock.createVerificationCode,
    ).toHaveBeenCalledWith(data, business, false);
    expect(out).toBe(businessesResponses.verificationCode.success);
  });

  it('verifyBusinessVerificationCode returns success response', async () => {
    const data = {} as VerifyVerificationCodeDto;
    const business = { businessId: 1 } as IBusinessReq;
    verificationCodesServiceMock.verifyCode.mockResolvedValue(undefined);
    const out = await resolver.verifyBusinessVerificationCode(data, business);
    expect(verificationCodesServiceMock.verifyCode).toHaveBeenCalledWith(
      data,
      business,
      false,
    );
    expect(out).toBe(businessesResponses.verifyCode.success);
  });
});
