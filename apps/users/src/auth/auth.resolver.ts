import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from '../../../../core/modules/auth/auth.service';
import { LoginDto } from '../../../../core/modules/auth/dto/login.dto';
import { JwtAuthGuard, TokenGuard } from '../../../../core/common/guards';
import { UserDec } from '../../../../core/common/decorators';
import { IUserReq } from '../../../../core/common/interfaces';
import { userResponses } from '../../../../core/common/responses';
import { Request, Response } from 'express';
import { LoginResponse } from '../../../../core/schemas/login-response.schema';
import { BaseResponse } from '../../../../core/schemas/base-response.schema';
import { SendVerificationCodeInput } from '../../../../core/modules/auth/dto/send-verification-code.input';
import { VerifyCodeInput } from '../../../../core/modules/auth/dto/verify-code.input';
import { AuthMailService } from '../../../../core/modules/auth/auth-mail.service';

@Resolver()
export class AuthResolver {

  constructor(
    private readonly authService: AuthService,
    private readonly authMailService: AuthMailService,
  ) { }

  @Mutation(() => LoginResponse)
  async login(
    @Args('login') login: LoginDto,
    @Context() ctx: any,
  ) {
    const res: Response = ctx.res;
    const result = await this.authService.validateUser(login);
    const token = result.token;
    const refreshToken = result.refreshToken;
    delete result.token;
    delete result.refreshToken;
    return await this.authService.setCookies(res, token, refreshToken, result, 'lineup_');
  }

  @Mutation(() => LoginResponse)
  async refreshToken(
    @Context() ctx: any,
  ) {
    const req: Request = ctx.req;
    const res: Response = ctx.res;
    return await this.authService.refreshAndSetCookies(req, res, 'lineup_');
  }

  @UseGuards(JwtAuthGuard, TokenGuard)
  @Mutation(() => BaseResponse)
  async logout(
    @Context() ctx: any,
    @UserDec() user: IUserReq,
  ) {
    const req: Request = ctx.req;
    const res: Response = ctx.res;
    return await this.authService.logout(req, res, user, userResponses.logout, 'lineup_');
  }

    /**
   * Creates a 6-digit verification code in the database and sends it
   * to the provided email address via the mails queue.
   *
   * @param {SendVerificationCodeInput} data - Input containing the recipient email
   * @returns {Promise<BaseResponse>}
   */
    @Mutation(() => BaseResponse)
    async sendVerificationCode(
      @Args('data') data: SendVerificationCodeInput,
    ): Promise<BaseResponse> {
      await this.authMailService.sendVerificationCodeEmail(data.email);
      return userResponses.verificationCode.success;
    }
  
    /**
     * Validates the 6-digit code submitted by the user against the stored record.
     * Marks the code as used if valid and not expired.
     *
     * @param {VerifyCodeInput} data - Input containing the email and the code
     * @returns {Promise<BaseResponse>}
     */
    @Mutation(() => BaseResponse)
    async verifyCode(
      @Args('data') data: VerifyCodeInput,
    ): Promise<BaseResponse> {
      await this.authMailService.verifyCode(data.email, data.code);
      return userResponses.verifyCode.success;
    }
}
