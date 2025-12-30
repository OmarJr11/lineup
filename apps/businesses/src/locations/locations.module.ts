import { Module } from '@nestjs/common';
import { LocationsModule as LocationsModuleCore } from '../../../../core/modules/locations/locations.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { TokensModule } from '../../../../core/modules/token/token.module';
import { LocationsResolver } from './locations.resolver';

@Module({
  imports: [
    LocationsModuleCore,
    RolesModule,
    TokensModule,
  ],
  providers: [LocationsResolver],
})
export class LocationsModule {}
