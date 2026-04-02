import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessHour } from '../../entities';
import { BusinessHoursService } from './business-hours.service';
import { BusinessHoursGettersService } from './business-hours-getters.service';
import { BusinessHoursSettersService } from './business-hours-setters.service';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessHour])],
  providers: [
    BusinessHoursService,
    BusinessHoursGettersService,
    BusinessHoursSettersService,
  ],
  exports: [
    BusinessHoursService,
    BusinessHoursGettersService,
    BusinessHoursSettersService,
  ],
})
export class BusinessHoursModule {}
