import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthModule as AuthModuleCore } from '../../../../core/modules/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
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
