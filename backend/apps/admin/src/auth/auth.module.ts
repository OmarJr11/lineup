import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthModule as AuthModuleCore } from '../../../../core/modules/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    AuthModuleCore,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController],
})
export class AuthModule { }
