import { Module } from '@nestjs/common';
import { BusinessRolesService } from './business-roles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessRole } from '../../entities';
import { BusinessRolesGettersService } from './business-roles-getters.service';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessRole])],
  providers: [BusinessRolesService, BusinessRolesGettersService],
  exports: [BusinessRolesService, BusinessRolesGettersService],
})
export class BusinessRolesModule {}
