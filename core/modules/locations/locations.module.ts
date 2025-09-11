import { Module } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from '../../entities';
import { LocationsGettersService } from './locations-getters.service';
import { LocationsSettersService } from './locations-setters.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location]),
  ],
  providers: [
    LocationsService,
    LocationsGettersService,
    LocationsSettersService,
  ],
  exports: [
    LocationsService,
    LocationsGettersService,
    LocationsSettersService,
  ],
})
export class LocationsModule {}
