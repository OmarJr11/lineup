import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { BusinessFollower } from '../../entities';
import { BasicService } from '../../common/services';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers/logger.helper';
import { businessFollowersResponses } from '../../common/responses';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { ICreateBusinessFollower, IUpdateBusinessFollower } from './interfaces/create-business-follower.interface';

@Injectable()
export class BusinessFollowersSettersService extends BasicService<BusinessFollower> {
    private logger = new Logger(BusinessFollowersSettersService.name);
    private readonly rFollow = businessFollowersResponses.follow;
    private readonly rUnfollow = businessFollowersResponses.unfollow;

    constructor(
      @InjectRepository(BusinessFollower)
      private readonly businessFollowerRepository: Repository<BusinessFollower>,
    ) {
      super(businessFollowerRepository);
    }

    /**
     * Create a new business follower.
     * @param {ICreateBusinessFollower} data - The data for the new business follower.
     * @param {IUserReq} userReq - The user request object.
     * @returns {Promise<BusinessFollower>} The created business follower.
     */
    @Transactional()
    async create(
        data: ICreateBusinessFollower,
        userReq: IUserReq
    ): Promise<BusinessFollower> {
      try {
        return await this.save(data, userReq);
      } catch (error) {
        LogError(this.logger, error, this.create.name, userReq);
        throw new InternalServerErrorException(this.rFollow.error);
      }
    }

    /**
     * Update a business follower.
     * @param {BusinessFollower} businessFollower - The business follower to update.
     * @param {IUpdateBusinessFollower} data - The data for updating the business follower.
     * @param {IUserReq} userReq - The user request object.
     * @returns {Promise<BusinessFollower>} The updated business follower.
     */
    @Transactional()
    async update(
        businessFollower: BusinessFollower,
        data: IUpdateBusinessFollower,
        userReq: IUserReq
    ): Promise<BusinessFollower> {
      try {
        return await this.updateEntity(data, businessFollower, userReq);
      } catch (error) {
        LogError(this.logger, error, this.update.name, userReq);
        throw new InternalServerErrorException(this.rFollow.error);
      }
    }

    /**
     * Remove a business follower (unfollow).
     * @param {BusinessFollower} businessFollower - The business follower to remove.
     * @param {IUserReq} userReq - The user request object.
     */
    @Transactional()
    async remove(businessFollower: BusinessFollower, userReq: IUserReq) {
      try {
        return await this.deleteEntity(businessFollower, { data: userReq});
      } catch (error) {
        LogError(this.logger, error, this.remove.name, userReq);
        throw new InternalServerErrorException(this.rUnfollow.error);
      }
    }
}
