import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { BasicService } from '../../common/services';
import { SocialNetwork } from '../../entities/social-network.entity';
import { Repository } from 'typeorm';
import { SocialNetworksGettersService } from './social-networks-getters.service';
import { SocialNetworksSettersService } from './social-networks-setters.service';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { CreateSocialNetworkInput } from './dto/create-social-network.input';
import { IUserReq } from '../../common/interfaces';
import { UpdateSocialNetworkInput } from './dto/update-social-network.input';
import { SocialMediasEnum } from '../../common/enums';

@Injectable({ scope: Scope.REQUEST })
export class SocialNetworksService extends BasicService<SocialNetwork> {
    private logger = new Logger(SocialNetworksService.name);

    constructor(
        @Inject(REQUEST) private readonly req: Request,
        @InjectRepository(SocialNetwork) 
        private readonly repo: Repository<SocialNetwork>,
        private readonly socialNetworksGettersService: SocialNetworksGettersService,
        private readonly socialNetworksSettersService: SocialNetworksSettersService,
    ) {
        super(repo, req);
    }

    /**
     * Create Social Network
     * @param {CreateSocialNetworkInput} data - Data to create a social network
     * @param {IUserReq} user - User or business making the request
     * @returns {Promise<SocialNetwork>} - Created social network entity
     */
    @Transactional()
    async create(
        data: CreateSocialNetworkInput,
        user: IUserReq
    ): Promise<SocialNetwork> {
        const socialNetwork = await this.socialNetworksSettersService
            .create(data, user);
        return await this.socialNetworksGettersService
            .findById(socialNetwork.id);
    }

    /**
     * Find Social Network by code
     * @param {SocialMediasEnum} code - Social Media Code
     * @returns {Promise<SocialNetwork>} - Social Network entity
     */
    async findByCode(code: SocialMediasEnum): Promise<SocialNetwork> {
        return await this.socialNetworksGettersService.findByCode(code);
    }

    /**
     * Find Social Network by id
     * @param {number} id - Social Network ID
     * @returns {Promise<SocialNetwork>} - Social Network entity
     */
    async findById(id: number): Promise<SocialNetwork> {
        return await this.socialNetworksGettersService.findById(id);
    }

    /**
     * Update Social Network
     * @param {UpdateSocialNetworkInput} data - Data to update the social network
     * @param {IUserReq} user - User or business making the request
     * @returns {Promise<SocialNetwork>} - Updated social network entity
     **/
    @Transactional()
    async update(
        data: UpdateSocialNetworkInput,
        user: IUserReq
    ): Promise<SocialNetwork> {
        const socialNetwork = await this.socialNetworksGettersService
            .findById(data.id);
        await this.socialNetworksSettersService
            .update(data, socialNetwork, user);
        return await this.socialNetworksGettersService
            .findById(socialNetwork.id);
    }

    /**
     * Remove Social Network (soft delete)
     * @param {number} id - Social Network ID
     * @param {IUserReq} user - User or business making the request
     * @returns {Promise<boolean>} - True if the social network was removed successfully
     */
    @Transactional()
    async remove(
        id: number,
        user: IUserReq
    ): Promise<boolean> {
        const socialNetwork = await this.socialNetworksGettersService
            .findById(id);
        await this.socialNetworksSettersService
            .remove(socialNetwork, user);
        return true;
    }
}
