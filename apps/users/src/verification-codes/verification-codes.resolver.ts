import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard, TokenGuard } from '../../../../core/common/guards';
import { UserDec } from '../../../../core/common/decorators';
import { IUserReq } from '../../../../core/common/interfaces';
import { VerificationCodesService } from '../../../../core/modules/verification-codes/verification-codes.service';
import { BaseResponse } from '../../../../core/schemas/base-response.schema';
import { userResponses } from '../../../../core/common/responses';
import { CreateVerificationCodeDto } from '../../../../core/modules/verification-codes/dto/create-verification-code.dto';
import { VerifyVerificationCodeDto } from '../../../../core/modules/verification-codes/dto/verify-verification-code.dto';

/**
 * Resolver handling verification code mutations for authenticated users.
 */
@UseGuards(JwtAuthGuard, TokenGuard)
@Resolver()
export class VerificationCodesResolver {
  constructor(
    private readonly verificationCodesService: VerificationCodesService,
  ) {}

  /**
   * Requests a verification code for the authenticated user.
   * If an active non-expired code already exists it is reused; otherwise a new one is created.
   *
   * @param {CreateVerificationCodeDto} data - Destination and channel
   * @param {IUserReq} user - Authenticated user extracted from JWT
   * @returns {Promise<BaseResponse>}
   */
  @Mutation(() => BaseResponse)
  @UseGuards(JwtAuthGuard, TokenGuard)
  async sendUserVerificationCode(
    @Args('data') data: CreateVerificationCodeDto,
    @UserDec() user: IUserReq,
  ): Promise<BaseResponse> {
    await this.verificationCodesService.createVerificationCode(data, user, true);
    return userResponses.verificationCode.success;
  }

  /**
   * Verifies the code submitted by the authenticated user.
   * Marks the record as used if the code is valid and not expired.
   *
   * @param {VerifyVerificationCodeDto} data - Destination and code
   * @returns {Promise<BaseResponse>}
   */
  @Mutation(() => BaseResponse)
  @UseGuards(JwtAuthGuard, TokenGuard)
  async verifyUserVerificationCode(
    @Args('data') data: VerifyVerificationCodeDto,
    @UserDec() user: IUserReq,
  ): Promise<BaseResponse> {
    await this.verificationCodesService.verifyCode(data, user, true);
    return userResponses.verifyCode.success;
  }
}
