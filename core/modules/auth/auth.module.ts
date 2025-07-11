import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TokensModule } from '../token/token.module';
import { JwtStrategy, WsJwtStrategy } from '../../common/strategies';
import { ConfigService } from '@nestjs/config';
import { BusinessesModule } from '../businesses/businesses.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    TokensModule,
    BusinessesModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, WsJwtStrategy],
  exports: [AuthService],
})
export class AuthModule { }
