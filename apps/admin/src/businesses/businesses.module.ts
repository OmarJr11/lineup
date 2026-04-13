import { Module } from '@nestjs/common';
import { BusinessesModule as BusinessesModuleCore } from '../../../../core/modules/businesses/businesses.module';
import { BusinessesResolver } from './businesses.resolver';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { TokensModule } from '../../../../core/modules/token/token.module';

/**
 * Admin GraphQL module for platform-wide business management.
 */
@Module({
  providers: [BusinessesResolver],
  imports: [BusinessesModuleCore, RolesModule, TokensModule],
})
export class BusinessesModule {}
