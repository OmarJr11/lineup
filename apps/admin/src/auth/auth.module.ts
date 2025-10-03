import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthModule as AuthModuleCore } from '../../../../core/modules/auth/auth.module';
import { TokensModule } from '../../../../core/modules/token/token.module';

@Module({
  imports: [
    AuthModuleCore,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
    TokensModule,
  ],
  controllers: [AuthController],
})
export class AuthModule { }
