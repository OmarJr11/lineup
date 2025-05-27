import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TokensModule } from '../tokens/tokens.module';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { WsJwtStrategy } from '../../common/strategies/ws-jwt.strategy';

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
export class AuthModule {}
