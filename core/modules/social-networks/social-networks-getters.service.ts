import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BasicService } from '../../common/services';
import { SocialNetwork } from '../../entities';
import { Not, Repository } from 'typeorm';
import { SocialMediasEnum, StatusEnum } from '../../common/enums';
import { socialNetworksResponse } from '../../common/responses';
import { LogError } from '../../common/helpers/logger.helper';

@Injectable()
export class SocialNetworksGettersService extends BasicService<SocialNetwork> {
  private logger = new Logger(SocialNetworksGettersService.name);
  private readonly rList = socialNetworksResponse.list;

  constructor(
    @InjectRepository(SocialNetwork)
    private readonly repo: Repository<SocialNetwork>
  ) {
    super(repo);
  }

  /**
   * Find Social Network by code
   * @param {SocialMediasEnum} code - Social Media Code
   * @returns {Promise<SocialNetwork>} - Social Network entity
   */
  async findByCode(code: SocialMediasEnum): Promise<SocialNetwork> {
    try {
      return await this.findOneWithOptionsOrFail({
        where: { code, status: Not(StatusEnum.DELETED) }
      });
    } catch (error) {
      LogError(this.logger, error, this.findByCode.name);
      throw new NotFoundException(this.rList.notFound); 
    }
  }

  /**
   * Find Social Network by id
   * @param {number} id - Social Network ID
   * @returns {Promise<SocialNetwork>} - Social Network entity
   */
  async findById(id: number): Promise<SocialNetwork> {  
      try {
        return await this.findOneWithOptionsOrFail({
          where: { id, status: Not(StatusEnum.DELETED) }
        });
      } catch (error) {
        LogError(this.logger, error, this.findById.name);
        throw new NotFoundException(this.rList.notFound);
      }
  }

  /** Find all Social Networks
   * @returns {Promise<SocialNetwork[]>} - Array of Social Network entities
   */
  async findAll(): Promise<SocialNetwork[]> {
    try {
      return await this.find({ 
        where: { status: Not(StatusEnum.DELETED) },
        relations: ['image']
      });
    } catch (error) {
      LogError(this.logger, error, this.findAll.name);
      throw new NotFoundException(this.rList.error);
    }
  }
}
