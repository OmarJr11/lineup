import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSocialNetworkBusinessInput } from './dto/create-social-network-business.input';
import { UpdateSocialNetworkBusinessInput } from './dto/update-social-network-business.input';
import { SocialNetworkBusiness } from '../../entities';
import { BasicService } from '../../common/services';
import { Repository } from 'typeorm';
import { IBusinessReq } from '../../common/interfaces';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { LogError } from '../../common/helpers/logger.helper';
import { socialNetworkBusinessesResponses } from '../../common/responses';

@Injectable()
export class SocialNetworkBusinessesSettersService extends BasicService<SocialNetworkBusiness> {
    private logger = new Logger(SocialNetworkBusinessesSettersService.name);
    private readonly rCreate = socialNetworkBusinessesResponses.create;
    private readonly rUpdate = socialNetworkBusinessesResponses.update;
    private readonly rDelete = socialNetworkBusinessesResponses.delete;

    constructor(
        @InjectRepository(SocialNetworkBusiness)
        private readonly repo: Repository<SocialNetworkBusiness>,
    ) {
        super(repo);
    }

    /**
     * Creates a new social network business
     * @param {CreateSocialNetworkBusinessInput} data - The data for the new social network business
     * @param {IBusinessReq} businessReq - The business request object
     * @returns {Promise<SocialNetworkBusiness>} The created social network business
     */
    @Transactional()
    async create(
        data: CreateSocialNetworkBusinessInput,
        businessReq: IBusinessReq
    ): Promise<SocialNetworkBusiness> {
        try {
            const { url, phone } = data.contact;
            data.url = url;
            data.phone = phone;
            return await this.save(data, businessReq);
        } catch (error) {
            LogError(this.logger, error, this.create.name, businessReq);
            throw new InternalServerErrorException(this.rCreate.error);
        }
    }

    /**
     * Update a social network business
     * @param {UpdateSocialNetworkBusinessInput} data - The data for updating the social network business
     * @param {SocialNetworkBusiness} socialNetworkBusiness - The social network business to update
     * @param {IBusinessReq} businessReq - The business request object
     * @returns {Promise<SocialNetworkBusiness>} The updated social network business
     */
    @Transactional()
    async update(
        data: UpdateSocialNetworkBusinessInput,
        socialNetworkBusiness: SocialNetworkBusiness,
        businessReq: IBusinessReq
    ): Promise<SocialNetworkBusiness> {
        try {
            return await this.updateEntity(data, socialNetworkBusiness, businessReq);
        } catch (error) {
            LogError(this.logger, error, this.update.name, businessReq);
            throw new InternalServerErrorException(this.rUpdate.error);
        }
    }

    /**
     * Remove a social network business
     * @param {SocialNetworkBusiness} socialNetworkBusiness - The social network business to remove
     * @param {IBusinessReq} businessReq - The business request object
     * @return {Promise<boolean>} True if the social network business was removed successfully
     */
    @Transactional()
    async remove(
        socialNetworkBusiness: SocialNetworkBusiness,
        businessReq: IBusinessReq
    ): Promise<boolean> {
        try {
            await this.deleteEntityByStatus(socialNetworkBusiness, businessReq);
            return true;
        } catch (error) {
            LogError(this.logger, error, this.remove.name, businessReq);
            throw new InternalServerErrorException(this.rDelete.error);
        }
    }
}
