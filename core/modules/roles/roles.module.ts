import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role, RolePermission } from '../../entities';
import { RolePermissionsModule } from '../role-permissions/role-permissions.module';
import { RolesPermissionsCheckerService } from './roles-permissions-checker.service';
import { RolesService } from './roles.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, RolePermission]),
    RolePermissionsModule,
  ],
  providers: [RolesService, RolesPermissionsCheckerService],
  exports: [RolesService, RolesPermissionsCheckerService],
})
export class RolesModule {}
