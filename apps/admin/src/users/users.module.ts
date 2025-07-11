import { Module } from '@nestjs/common';
import { UsersResolver } from './users.resolver';
import { UsersModule as UsersModuleCore } from '../../../../core/modules/users/users.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { TokensModule } from '../../../../core/modules/token/token.module';

@Module({
  providers: [UsersResolver],
  imports: [UsersModuleCore, RolesModule, TokensModule],

})
export class UsersModule { }
