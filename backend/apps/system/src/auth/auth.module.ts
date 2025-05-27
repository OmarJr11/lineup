import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthModule as AuthModuleCore } from '../../../../core/system/auth/auth.module';

@Module({
  imports: [AuthModuleCore],
  controllers: [AuthController],
})
export class AuthModule {}
