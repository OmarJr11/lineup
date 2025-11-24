import { Module } from '@nestjs/common';
import { AuthResolver } from './auth.resolver';
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
  providers: [AuthResolver],
})
export class AuthModule { }
