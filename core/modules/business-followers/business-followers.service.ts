import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Queue } from 'bullmq';
import { BasicService } from '../../common/services';
import { BusinessFollower, Business } from '../../entities';
import { Repository } from 'typeorm';
import { BusinessFollowersGettersService } from './business-followers-getters.service';
import { BusinessFollowersSettersService } from './business-followers-setters.service';
import { IUserReq } from '../../common/interfaces';
import { QueueNamesEnum, SearchDataConsumerEnum } from '../../common/enums';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { BusinessesGettersService } from '../businesses/businesses-getters.service';
import { BusinessesSettersService } from '../businesses/businesses-setters.service';
import { ICreateBusinessFollower } from './interfaces/create-business-follower.interface';

@Injectable()
export class BusinessFollowersService extends BasicService<BusinessFollower> {
    private logger = new Logger(BusinessFollowersService.name);

    constructor(
      @Inject(REQUEST)
      private readonly userRequest: Request,
      @InjectRepository(BusinessFollower)
      private readonly businessFollowerRepository: Repository<BusinessFollower>,
      private readonly businessFollowersGettersService: BusinessFollowersGettersService,
      private readonly businessFollowersSettersService: BusinessFollowersSettersService,
      private readonly businessesGettersService: BusinessesGettersService,
      private readonly businessesSettersService: BusinessesSettersService,
      @InjectQueue(QueueNamesEnum.searchData)
      private readonly searchDataQueue: Queue,
    ) {
      super(businessFollowerRepository, userRequest);
    }

    /**
     * Follow a business.
     * @param {number} idBusiness - The business ID.
     * @param {IUserReq} userReq - The user request object.
     * @returns {Promise<BusinessFollower>} The created business follower.
     */
    @Transactional()
    async followBusiness(idBusiness: number, userReq: IUserReq): Promise<BusinessFollower> {
        const business = await this.businessesGettersService.findOne(idBusiness);
        const existingFollower = await this.businessFollowersGettersService
            .findOneByBusinessAndUser(idBusiness, userReq.userId);
        if (existingFollower) return existingFollower;
        const data: ICreateBusinessFollower = { idBusiness, idCreationUser: userReq.userId };
        const follower = await this.businessFollowersSettersService.create(data, userReq);
        this.incrementBusinessLikes(business, userReq);
        await this.searchDataQueue.add(
            SearchDataConsumerEnum.SearchDataBusinessFollowRecord,
            { idBusiness, action: 'follow' }
        );
        return await this.businessFollowersGettersService.findOne(follower.id);
    }

    /**
     * Unfollow a business.
     * @param {number} idBusiness - The business ID.
     * @param {IUserReq} userReq - The user request object.
     * @returns {Promise<boolean>} True if the unfollow was successful.
     */
    @Transactional()
    async unfollowBusiness(
        idBusiness: number,
        userReq: IUserReq
    ): Promise<boolean> {
        const business = await this.businessesGettersService.findOne(idBusiness);
        const existingFollower = await this.businessFollowersGettersService
            .findOneByBusinessAndUser(idBusiness, userReq.userId);
        if (!existingFollower) return true;
        await this.businessFollowersSettersService.remove(existingFollower, userReq);
        this.decrementBusinessLikes(business, userReq);
        await this.searchDataQueue.add(
            SearchDataConsumerEnum.SearchDataBusinessFollowRecord,
            { idBusiness, action: 'unfollow' }
        );
        return true;
    }

    /**
     * Increment the likes count on a business.
     * @param {Business} business - The business.
     * @param {IUserReq} userReq - The user request object.
     */
    private async incrementBusinessLikes(business: Business, userReq: IUserReq){
        await this.businessesSettersService.incrementFollowers(business, userReq);
    }

    /**
     * Decrement the likes count on a business.
     * @param {Business} business - The business.
     * @param {IUserReq} userReq - The user request object.
     */
    private async decrementBusinessLikes(business: Business, userReq: IUserReq) {
        await this.businessesSettersService.decrementFollowers(business, userReq);
    }
}
