import { Module } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../../entities';
import { BusinessesGettersService } from './businesses-getters.service';
import { BusinessesSettersService } from './businesses-setters.service';
import { BusinessRolesModule } from '../business-roles/business-roles.module';
import { RolesModule } from '../roles/roles.module';
import { LocationsModule } from '../locations/locations.module';
import { EntityAuditsModule } from '../entity-audits/entity-audits.module';
import { BullModule } from '@nestjs/bullmq';
import { QueueNamesEnum } from '../../common/enums';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business]),
    BusinessRolesModule,
    EntityAuditsModule,
    RolesModule,
    LocationsModule,
    NotificationsModule,
    BullModule.registerQueue(
      {
        name: QueueNamesEnum.searchData,
        defaultJobOptions: {
          removeOnComplete: true,
        },
      },
      {
        name: QueueNamesEnum.notifications,
        defaultJobOptions: {
          removeOnComplete: true,
        },
      },
    ),
  ],
  providers: [
    BusinessesService,
    BusinessesGettersService,
    BusinessesSettersService,
  ],
  exports: [
    BusinessesService,
    BusinessesGettersService,
    BusinessesSettersService,
  ],
})
export class BusinessesModule {}
