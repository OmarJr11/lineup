import { Module } from '@nestjs/common';
import { BusinessRolesService } from './business-roles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessRole } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessRole])],
  providers: [BusinessRolesService],
  exports: [BusinessRolesService],
})
export class BusinessRolesModule { }
