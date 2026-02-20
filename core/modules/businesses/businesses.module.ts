import { Module } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../../entities';
import { BusinessesGettersService } from './businesses-getters.service';
import { BusinessesSettersService } from './businesses-setters.service';
import { BusinessRolesModule } from '../business-roles/business-roles.module';
import { RolesModule } from '../roles/roles.module';
import { LocationsModule } from '../locations/locations.module';
import { BullModule } from '@nestjs/bullmq';
import { QueueNamesEnum } from '../../common/enums';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business]),
    BusinessRolesModule,
    RolesModule,
    LocationsModule,
    BullModule.registerQueue({
      name: QueueNamesEnum.searchData,
      defaultJobOptions: {
        removeOnComplete: true,
      }
    }),
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
