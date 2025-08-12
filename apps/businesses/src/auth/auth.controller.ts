import { Controller, Post, Body, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { TokenHeaderInterceptor } from '../../../../core/common/interceptors';
import { AuthService } from '../../../../core/modules/auth/auth.service';
import { LoginDto } from '../../../../core/modules/auth/dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @UsePipes(new ValidationPipe())
  @UseInterceptors(TokenHeaderInterceptor)
  @Post('login')
  async loginBusiness(@Body() login: LoginDto) {
    return await this.authService.validateBusiness(login);
  }
}
