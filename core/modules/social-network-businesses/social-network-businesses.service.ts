import { Inject, Injectable, Logger, NotAcceptableException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { CreateSocialNetworkBusinessInput } from './dto/create-social-network-business.input';
import { UpdateSocialNetworkBusinessInput } from './dto/update-social-network-business.input';
import { BasicService } from '../../common/services';
import { SocialNetworkBusiness } from '../../entities';
import { Repository } from 'typeorm';
import { IBusinessReq } from '../../common/interfaces';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { SocialNetworkBusinessesGettersService } from './social-network-businesses-getters.service';
import { SocialNetworkBusinessesSettersService } from './social-network-businesses-setters.service';
import { BusinessesGettersService } from '../businesses/businesses-getters.service';
import { SocialNetworksGettersService } from '../social-networks/social-networks-getters.service';
import { socialNetworkBusinessesResponses } from '../../common/responses';
import { LogError } from '../../common/helpers/logger.helper';

@Injectable({ scope: Scope.REQUEST })
export class SocialNetworkBusinessesService extends BasicService<SocialNetworkBusiness> {
    private logger = new Logger(SocialNetworkBusinessesService.name);
    private readonly rCreate = socialNetworkBusinessesResponses.create;

    constructor(
        @Inject(REQUEST) private readonly req: Request,
        @InjectRepository(SocialNetworkBusiness) 
        private readonly repo: Repository<SocialNetworkBusiness>,
        private readonly socialNetworkBusinessesGettersService: SocialNetworkBusinessesGettersService,
        private readonly socialNetworkBusinessesSettersService: SocialNetworkBusinessesSettersService,
        private readonly businessesGettersService: BusinessesGettersService,
        private readonly socialNetworksGettersService: SocialNetworksGettersService,
    ) {
        super(repo, req);
    }

    /**
     * Create Social Network Business
     * @param {CreateSocialNetworkBusinessInput} data - Data to create a social network business
     * @param {IBusinessReq} businessReq - Business making the request
     * @returns {Promise<SocialNetworkBusiness>} - Created social network business entity
     */
    @Transactional()
    async create(
        data: CreateSocialNetworkBusinessInput,
        businessReq: IBusinessReq
    ): Promise<SocialNetworkBusiness> {
        await this.checkIfSocialNetworkBusinessExists(businessReq.businessId, data.idSocialNetwork);
        const socialNetworkBusiness = await this.socialNetworkBusinessesSettersService.create(data, businessReq);
        return await this.socialNetworkBusinessesGettersService.findOne(socialNetworkBusiness.id);
    }

    /**
     * Find all Social Network Businesses for a business
     * @param {number} idBusiness - Business ID
     * @returns {Promise<SocialNetworkBusiness[]>} - Array of Social Network Business entities
     */
    async findByBusiness(idBusiness: number): Promise<SocialNetworkBusiness[]> {
        return await this.socialNetworkBusinessesGettersService.findByBusiness(idBusiness);
    }

    /**
     * Find Social Network Business by id
     * @param {number} id - Social Network Business ID
     * @returns {Promise<SocialNetworkBusiness>} - Social Network Business entity
     */
    async findOne(id: number): Promise<SocialNetworkBusiness> {
        return await this.socialNetworkBusinessesGettersService.findOne(id);
    }

    /**
     * Update Social Network Business
     * @param {UpdateSocialNetworkBusinessInput} data - Data to update the social network business
     * @param {IBusinessReq} businessReq - Business making the request
     * @returns {Promise<SocialNetworkBusiness>} - Updated social network business entity
     **/
    @Transactional()
    async update(
        data: UpdateSocialNetworkBusinessInput,
        businessReq: IBusinessReq
    ): Promise<SocialNetworkBusiness> {
        if(data.idSocialNetwork) await this
            .checkIfSocialNetworkBusinessExists(businessReq.businessId, data.idSocialNetwork);
        const socialNetworkBusiness = await this.socialNetworkBusinessesGettersService
            .findOne(data.id);
        await this.socialNetworkBusinessesSettersService
            .update(data, socialNetworkBusiness, businessReq);
        return await this.socialNetworkBusinessesGettersService.findOne(socialNetworkBusiness.id);
    }

    /**
     * Remove Social Network Business (soft delete)
     * @param {number} id - Social Network Business ID
     * @param {IBusinessReq} businessReq - Business making the request
     * @returns {Promise<boolean>} - True if the social network business was removed successfully
     */
    @Transactional()
    async remove(
        id: number,
        businessReq: IBusinessReq
    ): Promise<boolean> {
        const socialNetworkBusiness = await this.socialNetworkBusinessesGettersService.findOne(id);
        await this.socialNetworkBusinessesSettersService.remove(socialNetworkBusiness, businessReq);
        return true;
    }

    /**
     * Check if a social network business exists by business ID and social network ID
     * @param {number} idBusiness - Business ID
     * @param {number} idSocialNetwork - Social Network ID
     */
    private async checkIfSocialNetworkBusinessExists(idBusiness: number, idSocialNetwork: number) {
        const business = await this.businessesGettersService.findOne(idBusiness);
        const socialNetwork = await this.socialNetworksGettersService.findById(idSocialNetwork);
        const exists = await this.socialNetworkBusinessesGettersService
            .checkIfExistsByIdBusinessAndSocialNetwork(business.id, socialNetwork.id);
        if (exists) {
            LogError(this.logger, this.rCreate.alreadyExists.message, this.create.name);
            throw new NotAcceptableException(this.rCreate.alreadyExists);
        }
    }
}
