import { Module } from '@nestjs/common';
import { BusinessesResolver } from './businesses.resolver';
import { BusinessesModule as BusinessesModuleCore } from '../../../../core/modules/businesses/businesses.module';
import { TokensModule } from '../../../../core/modules/token/token.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';

@Module({
  imports: [
    BusinessesModuleCore,
    RolesModule,
    TokensModule
  ],  
  providers: [BusinessesResolver],
})
export class BusinessesModule {}
