import { Controller, Post, Body, Res, Req, UseGuards } from '@nestjs/common';
import { AuthService } from '../../../../core/modules/auth/auth.service';
import { LoginDto } from '../../../../core/modules/auth/dto/login.dto';
import { Request } from 'express';
import { Response } from 'express';
import { BusinessDec } from '../../../../core/common/decorators';
import { IBusinessReq, IUserReq } from '../../../../core/common/interfaces';
import { JwtAuthGuard, TokenGuard } from '../../../../core/common/guards';
import { businessesResponses } from '../../../../core/common/responses';

@Controller('auth')
export class AuthController {
  
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async loginBusiness(@Body() login: LoginDto, @Res() res: Response) {
    const result = await this.authService.validateBusiness(login);
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
      @BusinessDec() user: IBusinessReq,
      @Res() res: Response
  ) {
      return await this.authService.logout(req, res, user, businessesResponses.logout);
  }
}
