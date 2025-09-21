import { Controller, Post, Body, Res, UseGuards, Req } from '@nestjs/common';
import { AuthService } from '../../../../core/modules/auth/auth.service';
import { LoginDto } from '../../../../core/modules/auth/dto/login.dto';
import { Request } from 'express';
import { Response } from 'express';
import { JwtAuthGuard, TokenGuard } from '../../../../core/common/guards';
import { UserDec } from '../../../../core/common/decorators';
import { IUserReq } from '../../../../core/common/interfaces';
import { userResponses } from '../../../../core/common/responses';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async loginBusiness(@Body() login: LoginDto, @Res() res: Response) {
    const result = await this.authService.validateUser(login);
    const token = result.token;
    const refreshToken = result.refreshToken;
    delete result.token;
    delete result.refreshToken;
    return await this.authService.setCookies(res, token, refreshToken, result);
  }

  @UseGuards(JwtAuthGuard, TokenGuard)
  @Post('logout')
  async logout(
      @Req() req: Request,
      @UserDec() user: IUserReq,
      @Res() res: Response
  ) {
      return await this.authService.logout(req, res, user, userResponses.logout);
  }
}
