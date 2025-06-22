import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersModule as UsersModuleCore } from '../../../../core/modules/users/users.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { TokensModule } from '../../../../core/modules/token/token.module';

@Module({
  controllers: [UsersController],
  imports: [UsersModuleCore, RolesModule, TokensModule],

})
export class UsersModule { }
