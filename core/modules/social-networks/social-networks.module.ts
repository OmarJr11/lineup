import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialNetwork } from '../../entities/social-network.entity';
import { SocialNetworksService } from './social-networks.service';
import { SocialNetworksSettersService } from './social-networks-setters.service';
import { SocialNetworksGettersService } from './social-networks-getters.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([SocialNetwork])
    ],
    providers: [
        SocialNetworksService,
        SocialNetworksSettersService,
        SocialNetworksGettersService,
    ],
    exports: [
        SocialNetworksService,
        SocialNetworksSettersService,
        SocialNetworksGettersService,
    ],
})
export class SocialNetworksModule {}
