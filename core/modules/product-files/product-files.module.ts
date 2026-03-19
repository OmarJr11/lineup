import { Module } from '@nestjs/common';
import { ProductFilesService } from './product-files.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductFile } from '../../entities';
import { ProductFilesGettersService } from './product-files-getters.service';
import { ProductFilesSettersService } from './product-files-setters.service';
import { EntityAuditsModule } from '../entity-audits/entity-audits.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductFile]),
    EntityAuditsModule,
  ],
  providers: [
    ProductFilesService,
    ProductFilesGettersService,
    ProductFilesSettersService
  ],
  exports: [
    ProductFilesService,
    ProductFilesGettersService,
    ProductFilesSettersService
  ]
})
export class ProductFilesModule {}
