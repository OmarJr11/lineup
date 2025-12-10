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

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) { }

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
}
