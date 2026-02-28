import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, TokenGuard } from '../../../../core/common/guards';
import { BusinessDec } from '../../../../core/common/decorators';
import { IBusinessReq } from '../../../../core/common/interfaces';
import { VerificationCodesService } from '../../../../core/modules/verification-codes/verification-codes.service';
import { BaseResponse } from '../../../../core/schemas/base-response.schema';
import { businessesResponses } from '../../../../core/common/responses';
import { CreateVerificationCodeDto } from '../../../../core/modules/verification-codes/dto/create-verification-code.dto';
import { VerifyVerificationCodeDto } from '../../../../core/modules/verification-codes/dto/verify-verification-code.dto';
/**
 * Resolver handling verification code mutations for authenticated businesses.
 */
@UseGuards(JwtAuthGuard, TokenGuard)
@Resolver()
export class VerificationCodesResolver {
  constructor(
    private readonly verificationCodesService: VerificationCodesService,
  ) {}

  /**
   * Requests a verification code for the authenticated business.
   * If an active non-expired code already exists it is reused; otherwise a new one is created.
   *
   * @param {SendBusinessVerificationCodeInput} data - Destination and channel
   * @param {IBusinessReq} business - Authenticated business extracted from JWT
   * @returns {Promise<BaseResponse>}
   */
  @Mutation(() => BaseResponse)
  @UseGuards(JwtAuthGuard, TokenGuard)
  async sendBusinessVerificationCode(
    @Args('data') data: CreateVerificationCodeDto,
    @BusinessDec() business: IBusinessReq,
  ): Promise<BaseResponse> {
    await this.verificationCodesService.createVerificationCode(data, business, false);
    return businessesResponses.verificationCode.success;
  }

  /**
   * Verifies the code submitted by the authenticated business.
   * Marks the record as used if the code is valid and not expired.
   *
   * @param {VerifyBusinessVerificationCodeInput} data - Destination and code
   * @returns {Promise<BaseResponse>}
   */
  @Mutation(() => BaseResponse)
  @UseGuards(JwtAuthGuard, TokenGuard)
  async verifyBusinessVerificationCode(
    @Args('data') data: VerifyVerificationCodeDto,
    @BusinessDec() business: IBusinessReq,
  ): Promise<BaseResponse> {
    await this.verificationCodesService.verifyCode(data, business, false);
    return businessesResponses.verifyCode.success;
  }
}
