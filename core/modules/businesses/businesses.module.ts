import { Module } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../../entities';
import { BusinessesGettersService } from './businesses-getters.service';
import { BusinessesSettersService } from './businesses-setters.service';
import { BusinessRolesModule } from '../business-roles/business-roles.module';
import { RolesModule } from '../roles/roles.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business]),
    BusinessRolesModule,
    RolesModule,
    LocationsModule,
  ],
  providers: [
    BusinessesService,
    BusinessesGettersService,
    BusinessesSettersService
  ],
  exports: [
    BusinessesService,
    BusinessesGettersService,
    BusinessesSettersService
  ],
})
export class BusinessesModule {}
