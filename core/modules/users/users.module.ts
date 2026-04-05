import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities';
import { UsersSettersService } from './users.setters.service';
import { UsersGettersService } from './users.getters.service';
import { RolesModule } from '../roles/roles.module';
import { UserRolesModule } from '../user-roles/user-roles.module';
import { StatesModule } from '../states/states.module';
import { FilesModule } from '../files/files.module';
import { QueueNamesEnum } from '../../common/enums';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    RolesModule,
    UserRolesModule,
    StatesModule,
    FilesModule,
    BullModule.registerQueue({
      name: QueueNamesEnum.notifications,
      defaultJobOptions: { removeOnComplete: true },
    }),
  ],
  providers: [UsersService, UsersSettersService, UsersGettersService],
  exports: [UsersService, UsersSettersService, UsersGettersService],
})
export class UsersModule {}
