import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Catalog, CatalogVisit } from '../../entities';
import { CatalogVisitsGettersService } from './catalog-visits-getters.service';
import { CatalogVisitsSettersService } from './catalog-visits-setters.service';
import { CatalogsModule } from '../catalogs/catalogs.module';

@Module({
  imports: [TypeOrmModule.forFeature([CatalogVisit, Catalog]), CatalogsModule],
  providers: [CatalogVisitsGettersService, CatalogVisitsSettersService],
  exports: [CatalogVisitsGettersService, CatalogVisitsSettersService],
})
export class CatalogVisitsModule {}
