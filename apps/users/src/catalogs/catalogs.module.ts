import { Module } from '@nestjs/common';
import { CatalogsResolver } from './catalogs.resolver';
import { CatalogsModule as CatalogsModuleCore } from '../../../../core/modules/catalogs/catalogs.module';

/**
 * Catalogs module for the users app.
 * Exposes read-only catalog queries with infinite scroll support.
 */
@Module({
  imports: [CatalogsModuleCore],
  providers: [CatalogsResolver],
  exports: [CatalogsResolver],
})
export class CatalogsModule {}
