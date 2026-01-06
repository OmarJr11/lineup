import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, PermissionsGuard, TokenGuard } from '../../../../core/common/guards';
import { SocialNetworkBusinessesService } from '../../../../core/modules/social-network-businesses/social-network-businesses.service';
import { CreateSocialNetworkBusinessInput } from '../../../../core/modules/social-network-businesses/dto/create-social-network-business.input';
import { UpdateSocialNetworkBusinessInput } from '../../../../core/modules/social-network-businesses/dto/update-social-network-business.input';
import { SocialNetworkBusinessSchema } from '../../../../core/schemas';
import { IBusinessReq } from '../../../../core/common/interfaces';
import { BusinessDec, Permissions, Response } from '../../../../core/common/decorators';
import { toSocialNetworkBusinessSchema } from '../../../../core/common/functions';
import { SocialNetworkBusinessesPermissionsEnum } from '../../../../core/common/enums';
import { socialNetworkBusinessesResponses } from '../../../../core/common/responses';

@UsePipes(new ValidationPipe())
@Resolver(() => SocialNetworkBusinessSchema)
export class SocialNetworkBusinessesResolver {
    constructor(
        private readonly socialNetworkBusinessesService: SocialNetworkBusinessesService
    ) {}

    @Mutation(() => SocialNetworkBusinessSchema, { name: 'createSocialNetworkBusiness' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(SocialNetworkBusinessesPermissionsEnum.SNBCRE)
    @Response(socialNetworkBusinessesResponses.create)
    async create(
        @Args('data') data: CreateSocialNetworkBusinessInput,
        @BusinessDec() businessReq: IBusinessReq
    ) {
        const socialNetworkBusiness = await this.socialNetworkBusinessesService.create(data, businessReq);
        return toSocialNetworkBusinessSchema(socialNetworkBusiness);
    }

    @Query(() => [SocialNetworkBusinessSchema], { name: 'findAllMySocialNetworkBusinesses' })
    @UseGuards(JwtAuthGuard, TokenGuard)
    async findAllMySocialNetworkBusinesses(@BusinessDec() businessReq: IBusinessReq) {
        const socialNetworkBusinesses = await this
            .socialNetworkBusinessesService.findByBusiness(businessReq.businessId);
        return socialNetworkBusinesses.map((snb) => toSocialNetworkBusinessSchema(snb));
    }

    @Query(() => [SocialNetworkBusinessSchema], { name: 'findByBusiness' })
    async findByBusiness(
        @Args('idBusiness', { type: () => Int }) idBusiness: number
    ) {
        const socialNetworkBusinesses = await this
            .socialNetworkBusinessesService.findByBusiness(idBusiness);
        return socialNetworkBusinesses.map((snb) => toSocialNetworkBusinessSchema(snb));
    }

    @Query(() => SocialNetworkBusinessSchema, { name: 'findOneSocialNetworkBusiness' })
    async findOne(
        @Args('id', { type: () => Int }) id: number,
    ) {
        const socialNetworkBusiness = await this.socialNetworkBusinessesService.findOne(id);
        return toSocialNetworkBusinessSchema(socialNetworkBusiness);
    }

    @Mutation(() => SocialNetworkBusinessSchema, { name: 'updateSocialNetworkBusiness' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(SocialNetworkBusinessesPermissionsEnum.SNBUPD)
    @Response(socialNetworkBusinessesResponses.update)
    async update(
        @Args('data') data: UpdateSocialNetworkBusinessInput,
        @BusinessDec() businessReq: IBusinessReq
    ) {
        const socialNetworkBusiness = await this.socialNetworkBusinessesService.update(data, businessReq);
        return toSocialNetworkBusinessSchema(socialNetworkBusiness);
    }

    @Mutation(() => Boolean, { name: 'removeSocialNetworkBusiness' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(SocialNetworkBusinessesPermissionsEnum.SNBDEL)
    @Response(socialNetworkBusinessesResponses.delete)
    async remove(
        @Args('id', { type: () => Int }) id: number,
        @BusinessDec() businessReq: IBusinessReq
    ) {
        const result = await this.socialNetworkBusinessesService.remove(id, businessReq);
        return result;
    }
}
