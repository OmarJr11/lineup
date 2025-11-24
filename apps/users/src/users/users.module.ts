import { Module } from '@nestjs/common';
import { UsersResolver } from './users.resolver';
import { UsersModule as UsersModuleCore } from '../../../../core/modules/users/users.module';
import { TokensModule } from '../../../../core/modules/token/token.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { AuthModule } from  '../../../../core/modules/auth/auth.module';

@Module({
  providers: [UsersResolver],
  exports: [UsersResolver],
  imports: [UsersModuleCore, RolesModule, TokensModule, AuthModule],
})
export class UsersModule {}
