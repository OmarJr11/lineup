import { Module } from '@nestjs/common';
import { UserRolesService } from './user-roles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRole } from '../../entities';
import { UserRolesGettersService } from './user-roles-getters.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserRole])],
  providers: [UserRolesService, UserRolesGettersService],
  exports: [UserRolesService, UserRolesGettersService],
})
export class UserRolesModule {}
