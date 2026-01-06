import { Module } from '@nestjs/common';
import { SocialNetworksResolver } from './social-networks.resolver';
import { SocialNetworksModule as SocialNetworksModuleCore } from '../../../../core/modules/social-networks/social-networks.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { TokensModule } from '../../../../core/modules/token/token.module';

@Module({
  providers: [SocialNetworksResolver],
  imports: [SocialNetworksModuleCore, RolesModule, TokensModule],
})
export class SocialNetworksModule {}
