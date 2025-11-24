import { Module } from '@nestjs/common';
import { BusinessesResolver } from './businesses.resolver';
import { BusinessesModule as BusinessesModuleCore } from '../../../../core/modules/businesses/businesses.module';
import { TokensModule } from '../../../../core/modules/token/token.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { AuthModule } from '../../../../core/modules/auth/auth.module';

@Module({
  imports: [
    BusinessesModuleCore,
    RolesModule,
    TokensModule,
    AuthModule
  ],
  providers: [BusinessesResolver],
})
export class BusinessesModule {}
