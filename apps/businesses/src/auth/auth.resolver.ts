import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from '../../../../core/modules/auth/auth.service';
import { LoginDto } from '../../../../core/modules/auth/dto/login.dto';
import { JwtAuthGuard, TokenGuard } from '../../../../core/common/guards';
import { BusinessDec } from '../../../../core/common/decorators';
import { IBusinessReq } from '../../../../core/common/interfaces';
import { businessesResponses } from '../../../../core/common/responses';
import { Request, Response } from 'express';
import { LoginResponse } from '../../../../core/schemas/login-response.schema';
import { BaseResponse } from '../../../../core/schemas/base-response.schema';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) { }

  @Mutation(() => LoginResponse)
  async login(
    @Args('login') login: LoginDto,
    @Context() ctx: any,
  ) {
    const res: Response = ctx.res;
    const result = await this.authService.validateBusiness(login);
    const token = result.token;
    const refreshToken = result.refreshToken;
    delete result.token;
    delete result.refreshToken;
    return await this.authService.setCookies(res, token, refreshToken, result, 'lineup_');
  }

  @UseGuards(JwtAuthGuard, TokenGuard)
  @Mutation(() => BaseResponse)
  async logout(
    @Context() ctx: any,
    @BusinessDec() business: IBusinessReq,
  ) {
    const req: Request = ctx.req;
    const res: Response = ctx.res;
    return await this.authService.logout(req, res, business, businessesResponses.logout, 'lineup_');
  }
}
