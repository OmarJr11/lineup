import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { State } from '../../entities';
import { StatesService } from './states.service';
import { StatesGettersService } from './states-getters.service';
import { StatesSettersService } from './states-setters.service';

@Module({
  imports: [TypeOrmModule.forFeature([State])],
  providers: [StatesService, StatesGettersService, StatesSettersService],
  exports: [StatesService, StatesGettersService, StatesSettersService],
})
export class StatesModule {}
