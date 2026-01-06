import { UsePipes, ValidationPipe } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { SocialNetworkSchema } from '../../../../core/schemas';
import { SocialNetworksService } from '../../../../core/modules/social-networks/social-networks.service';
import { toSocialNetworkSchema } from '../../../../core/common/functions';
import { SocialMediasEnum } from '../../../../core/common/enums';

@UsePipes(new ValidationPipe())
@Resolver(() => SocialNetworkSchema)
export class SocialNetworksResolver {
    constructor(
        private readonly socialNetworksService: SocialNetworksService,
    ) { }

    @Query(() => SocialNetworkSchema, { name: 'findSocialNetworkById' })
    async findById(@Args('id', { type: () => Int }) id: number) {
        return toSocialNetworkSchema(await this.socialNetworksService.findById(id));
    }

    @Query(() => SocialNetworkSchema, { name: 'findSocialNetworkByCode' })
    async findByCode(
        @Args('code', { type: () => SocialMediasEnum }) code: SocialMediasEnum
    ) {
        const socialNetwork = await this.socialNetworksService.findByCode(code);
        return toSocialNetworkSchema(socialNetwork);
    }

    @Query(() => [SocialNetworkSchema], { name: 'findAllSocialNetworks' })
    async findAll() {
        const items = await this.socialNetworksService.findAll();
        return items.map(socialNetwork => toSocialNetworkSchema(socialNetwork));
    }
}
