import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthModule as AuthModuleCore } from '../../../../core/modules/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    AuthModuleCore,
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  controllers: [AuthController],
})
export class AuthModule { }
