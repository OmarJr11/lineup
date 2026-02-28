import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BusinessFollowersService } from './business-followers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessFollower } from '../../entities';
import { BusinessFollowersGettersService } from './business-followers-getters.service';
import { BusinessFollowersSettersService } from './business-followers-setters.service';
import { BusinessesModule } from '../businesses/businesses.module';
import { QueueNamesEnum } from '../../common/enums';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessFollower]),
    BusinessesModule,
    BullModule.registerQueue({
      name: QueueNamesEnum.searchData,
      defaultJobOptions: { removeOnComplete: true },
    }),
  ],
  providers: [
    BusinessFollowersService,
    BusinessFollowersGettersService,
    BusinessFollowersSettersService
  ],
  exports: [
    BusinessFollowersService,
    BusinessFollowersGettersService,
    BusinessFollowersSettersService
  ]
})
export class BusinessFollowersModule {}
