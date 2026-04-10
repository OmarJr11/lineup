import { VerificationCodesResolver } from './verification-codes.resolver';
import { VerificationCodesService } from '../../../../core/modules/verification-codes/verification-codes.service';
import { userResponses } from '../../../../core/common/responses';
import type { CreateVerificationCodeDto } from '../../../../core/modules/verification-codes/dto/create-verification-code.dto';
import type { VerifyVerificationCodeDto } from '../../../../core/modules/verification-codes/dto/verify-verification-code.dto';
import type { IUserReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link VerificationCodesResolver} (users app).
 */
describe('VerificationCodesResolver (users)', () => {
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

  it('sendUserVerificationCode uses user flag true', async () => {
    const data = {} as CreateVerificationCodeDto;
    const user = { userId: 1 } as IUserReq;
    verificationCodesServiceMock.createVerificationCode.mockResolvedValue(
      undefined,
    );
    const out = await resolver.sendUserVerificationCode(data, user);
    expect(
      verificationCodesServiceMock.createVerificationCode,
    ).toHaveBeenCalledWith(data, user, true);
    expect(out).toBe(userResponses.verificationCode.success);
  });

  it('verifyUserVerificationCode uses user flag true', async () => {
    const data = {} as VerifyVerificationCodeDto;
    const user = { userId: 1 } as IUserReq;
    verificationCodesServiceMock.verifyCode.mockResolvedValue(undefined);
    const out = await resolver.verifyUserVerificationCode(data, user);
    expect(verificationCodesServiceMock.verifyCode).toHaveBeenCalledWith(
      data,
      user,
      true,
    );
    expect(out).toBe(userResponses.verifyCode.success);
  });
});
