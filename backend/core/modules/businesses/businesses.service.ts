import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { CreateBusinessInput } from './dto/create-business.input';
import { UpdateBusinessInput } from './dto/update-business.input';
import { Business } from '../../entities';
import { BasicService } from '../../common/services';
import { businessesResponses } from '../../common/responses';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional-cls-hooked/dist/Transactional';
import { LogError } from '../../common/helpers/logger.helper';
import { IUserReq } from '../../common/interfaces';
import { BusinessesGettersService } from './businesses-getters.service';
import { BusinessesSettersService } from './businesses-setters.service';
import { InfinityScrollInput } from '../../common/dtos';

@Injectable()
export class BusinessesService extends BasicService<Business> {
  private logger = new Logger(BusinessesService.name);

  constructor(
    @Inject(REQUEST)
    private readonly userRequest: Request,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly businessesGettersService: BusinessesGettersService,
    private readonly businessSettersService: BusinessesSettersService
  ) {
    super(businessRepository, userRequest);
  }

  /**
   * Save a new business
   * @param {CreateBusinessInput} data - The business data to save
   * @param {IUserReq} user - The user making the request
   * @return {Promise<Business>} - The saved business entity
   * */
  @Transactional()
  async create(data: CreateBusinessInput, user: IUserReq): Promise<Business> {
    data.path = await this.checkBusinessPathExists(
      data.name.toLocaleLowerCase().replace(/\s+/g, '-')
    );
    const business = await this.businessSettersService.create(data, user);
    return business;
  }

  /**
   * Get all Businesses with pagination
   * @param {InfinityScrollInput} query - query parameters for pagination
   * @returns {Promise<Business[]>}
   */
  async findAll(query: InfinityScrollInput): Promise<Business[]> {
    return await this.businessesGettersService.findAll(query);
  }

  /**
   * Get Business by ID
   * @param {number} id - business ID
   * @returns {Promise<Business>}
   */
  async findOne(id: number): Promise<Business> {
    return await this.businessesGettersService.findOne(id);
  }

  /**
   * Get Business by path
   * @param {string} path - business path
   * @returns {Promise<Business>}
   */
  async findOneByPath(path: string): Promise<Business> {
    return await this.businessesGettersService.findOneByPath(path);
  }

  /**
   * Update a business
   * @param {number} id - The ID of the business to update
   * @param {UpdateBusinessInput} data - The data to update the business
   * @param {IUserReq} user - The user making the request
   * @returns {Promise<Business>} - The updated business entity
   */
  @Transactional()
  async update(
    id: number,
    data: UpdateBusinessInput,
    user: IUserReq
  ): Promise<Business> {
    const business = await this.businessesGettersService.findOne(id);
    if(data.path) {
      data.path = await this.checkBusinessPathExists(
        data.path.toLocaleLowerCase().replace(/\s+/g, '-')
      );
    }
    await this.businessSettersService.update(data, business, user);
    return await this.businessesGettersService.findOne(id);
  }

  /**
   * Remove a business
   * @param {number} id - The ID of the business to remove
   * @returns {Promise<boolean>}
   */
  @Transactional()
  async remove(id: number, user: IUserReq): Promise<boolean> {
    const business = await this.businessesGettersService.findOne(id);
    await this.businessSettersService.remove(business, user);
    return true;
  }

  /**
   * Check if a business path exists and generate a unique path if it does
   * @param {string} path - The initial business path to check
   * @returns {Promise<string>} - A unique business path
   */
  async checkBusinessPathExists(path: string): Promise<string> {
    let business = await this.businessesGettersService.getOneByPath(path);
    if(business) {
      let index = '01';
      while (business) {
        path = `${path}-${index}`;
        business = await this.businessesGettersService.getOneByPath(path);
        index = (parseInt(index, 10) + 1).toString().padStart(2, '0');
      }
    }
    return path;
  }
}
