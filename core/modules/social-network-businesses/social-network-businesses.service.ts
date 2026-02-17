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
import { SocialNetworkContactInput } from './dto/social-network-contact.input';
import {
    SOCIAL_NETWORKS_REQUIRING_PHONE,
    SOCIAL_NETWORKS_REQUIRING_URL,
} from '../../common/enums';
import { SocialNetwork } from '../../entities';

@Injectable({ scope: Scope.REQUEST })
export class SocialNetworkBusinessesService extends BasicService<SocialNetworkBusiness> {
    private logger = new Logger(SocialNetworkBusinessesService.name);
    private readonly rCreate = socialNetworkBusinessesResponses.create;

    constructor(
        @Inject(REQUEST) private readonly req: Request,
        @InjectRepository(SocialNetworkBusiness) 
        private readonly repo: Repository<SocialNetworkBusiness>,
        private readonly gettersService: SocialNetworkBusinessesGettersService,
        private readonly settersService: SocialNetworkBusinessesSettersService,
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
        const contact = data.contact;
        await this.checkIfSocialNetworkBusinessExists(
            businessReq.businessId,
            data.idSocialNetwork,
            contact
        );
        const socialNetworkBusiness = await this.settersService.create(data, businessReq);
        return await this.gettersService.findOne(socialNetworkBusiness.id);
    }

    /**
     * Find all Social Network Businesses for a business
     * @param {number} idBusiness - Business ID
     * @returns {Promise<SocialNetworkBusiness[]>} - Array of Social Network Business entities
     */
    async findByBusiness(idBusiness: number): Promise<SocialNetworkBusiness[]> {
        return await this.gettersService.findByBusiness(idBusiness);
    }

    /**
     * Find Social Network Business by id
     * @param {number} id - Social Network Business ID
     * @returns {Promise<SocialNetworkBusiness>} - Social Network Business entity
     */
    async findOne(id: number): Promise<SocialNetworkBusiness> {
        return await this.gettersService.findOne(id);
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
        const contact = data.contact;
        const socialNetworkBusiness = await this.gettersService.findOne(data.id);
        this.validateContactMatchesSocialNetwork(
            contact,
            socialNetworkBusiness.socialNetwork
        );
        await this.settersService.update(data, socialNetworkBusiness, businessReq);
        return await this.gettersService.findOne(socialNetworkBusiness.id);
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
        const socialNetworkBusiness = await this.gettersService.findOne(id);
        await this.settersService.remove(socialNetworkBusiness, businessReq);
        return true;
    }

    /**
     * Validates that the contact type (url or phone) matches the social network requirements.
     * - If contact has url: social network cannot be one that requires phone (WhatsApp, Telegram, Phone).
     * - If contact has phone: social network cannot be one that requires url (Facebook, Instagram, etc.).
     * @param {SocialNetworkContactInput | undefined} contact - The contact data
     * @param {SocialNetwork} socialNetwork - The social network entity
     * @throws {NotAcceptableException} When contact type does not match social network requirements
     */
    private validateContactMatchesSocialNetwork(
        contact: SocialNetworkContactInput | undefined,
        socialNetwork: SocialNetwork
    ): void {
        if (!contact) return;
        const hasUrl = contact.url && contact.url.trim() !== '';
        const hasPhone = contact.phone && contact.phone.trim() !== '';
        if (hasUrl && SOCIAL_NETWORKS_REQUIRING_PHONE.includes(socialNetwork.code)) {
            LogError(this.logger, this.rCreate.contactMismatch.message, this.validateContactMatchesSocialNetwork.name);
            throw new NotAcceptableException(this.rCreate.contactMismatch);
        }
        if (hasPhone && SOCIAL_NETWORKS_REQUIRING_URL.includes(socialNetwork.code)) {
            LogError(this.logger, this.rCreate.contactMismatch.message, this.validateContactMatchesSocialNetwork.name);
            throw new NotAcceptableException(this.rCreate.contactMismatch);
        }
    }

    private async checkIfSocialNetworkBusinessExists(
        idBusiness: number,
        idSocialNetwork: number,
        contact?: SocialNetworkContactInput
    ): Promise<void> {
        const business = await this.businessesGettersService.findOne(idBusiness);
        const socialNetwork = await this.socialNetworksGettersService.findById(idSocialNetwork);
        this.validateContactMatchesSocialNetwork(contact, socialNetwork);
        const exists = await this.gettersService
            .checkIfExistsByIdBusinessAndSocialNetwork(business.id, socialNetwork.id);
        if (exists) {
            LogError(this.logger, this.rCreate.alreadyExists.message, this.create.name);
            throw new NotAcceptableException(this.rCreate.alreadyExists);
        }
    }
}
