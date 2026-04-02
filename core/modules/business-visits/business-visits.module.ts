import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessVisit } from '../../entities';
import { BusinessVisitsGettersService } from './business-visits-getters.service';
import { BusinessVisitsSettersService } from './business-visits-setters.service';
import { BusinessesModule } from '../businesses/businesses.module';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessVisit]), BusinessesModule],
  providers: [BusinessVisitsGettersService, BusinessVisitsSettersService],
  exports: [BusinessVisitsGettersService, BusinessVisitsSettersService],
})
export class BusinessVisitsModule {}
