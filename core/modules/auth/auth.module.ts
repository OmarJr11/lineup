import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthMailService } from './auth-mail.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TokensModule } from '../token/token.module';
import { JwtStrategy, WsJwtStrategy } from '../../common/strategies';
import { ConfigService } from '@nestjs/config';
import { BusinessesModule } from '../businesses/businesses.module';
import { BullModule } from '@nestjs/bullmq';
import { QueueNamesEnum } from '../../common/enums/consumers';
import { ValidationMailsModule } from '../validation-mails/validation-mails.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    TokensModule,
    BusinessesModule,
    ValidationMailsModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
    BullModule.registerQueue({ name: QueueNamesEnum.mails }),
  ],
  providers: [AuthService, AuthMailService, JwtStrategy, WsJwtStrategy],
  exports: [AuthService, AuthMailService],
})
export class AuthModule { }
