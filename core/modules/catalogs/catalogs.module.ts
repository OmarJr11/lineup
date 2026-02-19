import { Module } from '@nestjs/common';
import { CatalogsService } from './catalogs.service';
import { Catalog } from '../../entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogsSettersService } from './catalogs-setters.service';
import { CatalogsGettersService } from './catalogs-getters.service';
import { BullModule } from '@nestjs/bullmq';
import { QueueNamesEnum } from '../../common/enums';

@Module({
  imports: [
    TypeOrmModule.forFeature([Catalog]),
    BullModule.registerQueue({
      name: QueueNamesEnum.searchData,
      defaultJobOptions: {
        removeOnComplete: true,
      }
    }),
  ],
  providers: [
    CatalogsService,
    CatalogsSettersService,
    CatalogsGettersService
  ],
  exports: [
    CatalogsService,
    CatalogsSettersService,
    CatalogsGettersService
  ],
})
export class CatalogsModule {}
