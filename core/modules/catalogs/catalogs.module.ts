import { Module } from '@nestjs/common';
import { CatalogsService } from './catalogs.service';
import { Catalog } from '../../entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogsSettersService } from './catalogs-setters.service';
import { CatalogsGettersService } from './catalogs-getters.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Catalog]),
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
