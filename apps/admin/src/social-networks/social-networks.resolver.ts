import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { SocialNetworkSchema } from '../../../../core/schemas';
import { SocialNetworksService } from '../../../../core/modules/social-networks/social-networks.service';
import { CreateSocialNetworkInput } from '../../../../core/modules/social-networks/dto/create-social-network.input';
import { UpdateSocialNetworkInput } from '../../../../core/modules/social-networks/dto/update-social-network.input';
import { Permissions, Response, UserDec } from '../../../../core/common/decorators';
import { JwtAuthGuard, PermissionsGuard, TokenGuard } from '../../../../core/common/guards';
import { socialNetworksResponse } from '../../../../core/common/responses';
import { toSocialNetworkSchema } from '../../../../core/common/functions';
import { SocialMediasEnum, SocialNetworkPermissionsEnum } from '../../../../core/common/enums';
import { IUserReq } from '../../../../core/common/interfaces';

@UsePipes(new ValidationPipe())
@Resolver(() => SocialNetworkSchema)
export class SocialNetworksResolver {
    constructor(
        private readonly socialNetworksService: SocialNetworksService,
    ) { }

    @Mutation(() => SocialNetworkSchema, { name: 'createSocialNetwork' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(SocialNetworkPermissionsEnum.SNWCRE)
    @Response(socialNetworksResponse.create)
    async createSocialNetwork(
        @Args('data') data: CreateSocialNetworkInput,
        @UserDec() user: IUserReq
    ) {
        const socialNetwork = await this.socialNetworksService.create(data, user);
        return toSocialNetworkSchema(socialNetwork);
    }

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

    @Mutation(() => SocialNetworkSchema, { name: 'updateSocialNetwork' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(SocialNetworkPermissionsEnum.SNWUPD)
    @Response(socialNetworksResponse.update)
    async updateSocialNetwork(
        @Args('data') data: UpdateSocialNetworkInput,
        @UserDec() user: IUserReq
    ) {
        const updatedSocialNetwork = await this.socialNetworksService.update(data, user);
        return toSocialNetworkSchema(updatedSocialNetwork);
    }

    @Mutation(() => Boolean, { name: 'removeSocialNetwork' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(SocialNetworkPermissionsEnum.SNWDEL)
    @Response(socialNetworksResponse.delete)
    async removeSocialNetwork(
        @Args('id', { type: () => Int }) id: number,
        @UserDec() user: IUserReq
    ) {
        await this.socialNetworksService.remove(id, user);
        return true;
    }
}
