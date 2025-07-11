import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities';
import { UsersSettersService } from './users.setters.service';
import { UsersGettersService } from './users.getters.service';
import { RolesModule } from '../roles/roles.module';
import { UserRolesModule } from '../user-roles/user-roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    RolesModule,
    UserRolesModule
  ],
  providers: [
    UsersService,
    UsersSettersService,
    UsersGettersService
  ],
  exports: [
    UsersService,
    UsersSettersService,
    UsersGettersService
  ],
})
export class UsersModule { }
