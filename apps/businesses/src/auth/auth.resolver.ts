import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from '../../../../core/modules/auth/auth.service';
import { AuthMailService } from '../../../../core/modules/auth/auth-mail.service';
import { LoginDto } from '../../../../core/modules/auth/dto/login.dto';
import { SendVerificationCodeInput } from '../../../../core/modules/auth/dto/send-verification-code.input';
import { VerifyCodeInput } from '../../../../core/modules/auth/dto/verify-code.input';
import { JwtAuthGuard, TokenGuard } from '../../../../core/common/guards';
import { BusinessDec } from '../../../../core/common/decorators';
import { IBusinessReq } from '../../../../core/common/interfaces';
import { businessesResponses } from '../../../../core/common/responses';
import { Request, Response } from 'express';
import { LoginResponse } from '../../../../core/schemas/login-response.schema';
import { BaseResponse } from '../../../../core/schemas/base-response.schema';

/**
 * Resolver handling authentication and email verification mutations
 * for the businesses app.
 */
@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly authMailService: AuthMailService,
  ) { }

  /**
   * Authenticates a business and sets session cookies.
   *
   * @param {LoginDto} login - Business credentials
   * @param ctx - GraphQL context containing the HTTP response
   * @returns {Promise<LoginResponse>}
   */
  @Mutation(() => LoginResponse)
  async login(
    @Args('login') login: LoginDto,
    @Context() ctx: any,
  ): Promise<LoginResponse> {
    const res: Response = ctx.res;
    const result = await this.authService.validateBusiness(login);
    const token = result.token;
    const refreshToken = result.refreshToken;
    delete result.token;
    delete result.refreshToken;
    return await this.authService.setCookies(res, token, refreshToken, result, 'lineup_');
  }

  /**
   * Refreshes the session token using the refresh token cookie.
   *
   * @param ctx - GraphQL context containing request and response
   * @returns {Promise<LoginResponse>}
   */
  @Mutation(() => LoginResponse)
  async refreshToken(
    @Context() ctx: any,
  ): Promise<LoginResponse> {
    const req: Request = ctx.req;
    const res: Response = ctx.res;
    return await this.authService.refreshAndSetCookies(req, res, 'lineup_');
  }

  /**
   * Logs out the authenticated business and clears session cookies.
   *
   * @param ctx - GraphQL context containing request and response
   * @param {IBusinessReq} business - Authenticated business from JWT
   * @returns {Promise<BaseResponse>}
   */
  @UseGuards(JwtAuthGuard, TokenGuard)
  @Mutation(() => BaseResponse)
  async logout(
    @Context() ctx: any,
    @BusinessDec() business: IBusinessReq,
  ): Promise<BaseResponse> {
    const req: Request = ctx.req;
    const res: Response = ctx.res;
    return await this.authService.logout(req, res, business, businessesResponses.logout, 'lineup_');
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
    return businessesResponses.verificationCode.success;
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
    return businessesResponses.verifyCode.success;
  }
}
