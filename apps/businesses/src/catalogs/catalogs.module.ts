import { Module } from '@nestjs/common';
import { CatalogsResolver } from './catalogs.resolver';
import { TokensModule } from '../../../../core/modules/token/token.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { CatalogsModule as CatalogsModuleCore } from '../../../../core/modules/catalogs/catalogs.module';

@Module({
  imports: [
    CatalogsModuleCore,
    RolesModule,
    TokensModule
  ],  
  providers: [CatalogsResolver],
})
export class CatalogsModule {}
