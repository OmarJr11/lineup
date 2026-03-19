import { Module } from '@nestjs/common';
import { SocialNetworkBusinessesService } from './social-network-businesses.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialNetworkBusiness } from '../../entities';
import { SocialNetworkBusinessesGettersService } from './social-network-businesses-getters.service';
import { SocialNetworkBusinessesSettersService } from './social-network-businesses-setters.service';
import { BusinessesModule } from '../businesses/businesses.module';
import { SocialNetworksModule } from '../social-networks/social-networks.module';
import { EntityAuditsModule } from '../entity-audits/entity-audits.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SocialNetworkBusiness]),
    EntityAuditsModule,
    BusinessesModule,
    SocialNetworksModule,
  ],
  providers: [
    SocialNetworkBusinessesService,
    SocialNetworkBusinessesGettersService,
    SocialNetworkBusinessesSettersService,
  ],
  exports: [
    SocialNetworkBusinessesService,
    SocialNetworkBusinessesGettersService,
    SocialNetworkBusinessesSettersService,
  ],
})
export class SocialNetworkBusinessesModule {}
