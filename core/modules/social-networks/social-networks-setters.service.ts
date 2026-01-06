import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BasicService } from '../../common/services';
import { SocialNetwork } from '../../entities/social-network.entity';
import { Repository } from 'typeorm';
import { socialNetworksResponse } from '../../common/responses';
import { IUserReq } from '../../common/interfaces';
import { CreateSocialNetworkInput } from './dto/create-social-network.input';
import { UpdateSocialNetworkInput } from './dto/update-social-network.input';
import { LogError } from '../../common/helpers/logger.helper';
import { Transactional } from 'typeorm-transactional-cls-hooked';

@Injectable()
export class SocialNetworksSettersService extends BasicService<SocialNetwork> {
  private logger = new Logger(SocialNetworksSettersService.name);
  private readonly rCreate = socialNetworksResponse.create;
  private readonly rUpdate = socialNetworksResponse.update;
  private readonly rDelete = socialNetworksResponse.delete;

  constructor(
    @InjectRepository(SocialNetwork)
    private readonly repo: Repository<SocialNetwork>
  ) {
    super(repo);
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
    try {
      return await this.save(data, user);
    } catch(error) {
      LogError(this.logger, error, this.create.name, user);
      throw new InternalServerErrorException(this.rCreate.error);
    }
  }

  /**
   * Update Social Network
   * @param {UpdateSocialNetworkInput} data - Data to update the social network
   * @param {SocialNetwork} socialNetwork - Social Network entity to update
   * @param {IUserReq} user - User or business making the request
   */
  @Transactional()
  async update(
    data: UpdateSocialNetworkInput,
    socialNetwork: SocialNetwork,
    user: IUserReq
  ) {
    try {
      return await this.updateEntity(data, socialNetwork, user);
    } catch (error) {
      LogError(this.logger, error, this.update.name, user);
      throw new InternalServerErrorException(this.rUpdate.error);
    }
  }

  /**
   * Remove Social Network (soft delete)
   * @param {SocialNetwork} socialNetwork - Social Network entity to remove
   * @param {IUserReq} user - User or business making the request
   */
  @Transactional()
  async remove(socialNetwork: SocialNetwork, user: IUserReq) {
    try {
      await this.deleteEntityByStatus(socialNetwork, user);
    } catch (error) {
      LogError(this.logger, error, this.remove.name, user);
      throw new InternalServerErrorException(this.rDelete.error);
    }
  }
}
