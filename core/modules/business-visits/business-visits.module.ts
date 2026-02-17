import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessVisit } from '../../entities';
import { BusinessVisitsSettersService } from './business-visits-setters.service';
import { BusinessesModule } from '../businesses/businesses.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([BusinessVisit]),
        BusinessesModule
    ],
    providers: [BusinessVisitsSettersService],
    exports: [BusinessVisitsSettersService]
})
export class BusinessVisitsModule {}
