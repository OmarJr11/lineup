import { Module } from '@nestjs/common';
import { SocialNetworkBusinessesResolver } from './social-network-businesses.resolver';
import { SocialNetworkBusinessesModule as SocialNetworkBusinessesModuleCore } from '../../../../core/modules/social-network-businesses/social-network-businesses.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { TokensModule } from '../../../../core/modules/token/token.module';

@Module({
  imports: [
    SocialNetworkBusinessesModuleCore,
    RolesModule,
    TokensModule,
  ],
  providers: [SocialNetworkBusinessesResolver],
})
export class SocialNetworkBusinessesModule {}
