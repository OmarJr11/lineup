import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TokensModule } from '../token/token.module';
import { JwtStrategy, WsJwtStrategy } from '../../common/strategies';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    TokensModule,
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  providers: [AuthService, JwtStrategy, WsJwtStrategy],
  exports: [AuthService],
})
export class AuthModule { }
