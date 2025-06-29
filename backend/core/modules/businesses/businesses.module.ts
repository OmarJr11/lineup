import { Module } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../../entities';
import { BusinessesGettersService } from './businesses-getters.service';
import { BusinessesSettersService } from './businesses-setters.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business]),
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
