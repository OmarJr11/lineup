import { Controller, Post, Body, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { TokenHeaderInterceptor } from '../../../../core/common/interceptors';
import { AuthService } from '../../../../core/modules/auth/auth.service';
import { LoginDto } from '../../../../core/modules/auth/dto/login.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 201, description: 'User logged.' })
  @UsePipes(new ValidationPipe())
  @UseInterceptors(TokenHeaderInterceptor)
  @Post('login')
  async loginUser(@Body() login: LoginDto) {
    return await this.authService.validateUserAdmin(login);
  }
}
