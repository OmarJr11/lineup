import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogVisit } from '../../entities';
import { CatalogVisitsSettersService } from './catalog-visits-setters.service';
import { CatalogsModule } from '../catalogs/catalogs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([CatalogVisit]),
        CatalogsModule
    ],
    providers: [CatalogVisitsSettersService],
    exports: [CatalogVisitsSettersService]
})
export class CatalogVisitsModule {}
