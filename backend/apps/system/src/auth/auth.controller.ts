import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from '../../../../core/system/auth/auth.service';
import { CreateAuthDto } from '../../../../core/system/auth/dto/create-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  create(@Body() data: CreateAuthDto) {
    return this.authService.create(data);
  }
}
