import { Inject, Injectable, Logger, NotAcceptableException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { ChangePasswordInput } from '../../common/dtos';
import { CreateBusinessInput } from './dto/create-business.input';
import { UpdateBusinessInput } from './dto/update-business.input';
import { Business } from '../../entities';
import { BasicService } from '../../common/services';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional-cls-hooked/dist/Transactional';
import { IBusinessReq, IUserReq } from '../../common/interfaces';
import { BusinessesGettersService } from './businesses-getters.service';
import { BusinessesSettersService } from './businesses-setters.service';
import { InfinityScrollInput } from '../../common/dtos';
import { generateRandomCodeByLength } from '../../common/helpers/generators.helper';
import * as argon2 from 'argon2';
import { ProvidersEnum, QueueNamesEnum, SearchDataConsumerEnum } from '../../common/enums';
import { RolesService } from '../roles/roles.service';
import { BusinessRolesService } from '../business-roles/business-roles.service';
import { LogError } from '../../common/helpers/logger.helper';
import { businessesResponses } from '../../common/responses';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class BusinessesService extends BasicService<Business> {
  private logger = new Logger(BusinessesService.name);
  private readonly _uList = businessesResponses.list;
  private readonly _uUp = businessesResponses.update;
  private readonly _uChangePassword = businessesResponses.changePassword;

  constructor(
    @Inject(REQUEST)
    private readonly userRequest: Request,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly businessesGettersService: BusinessesGettersService,
    private readonly businessSettersService: BusinessesSettersService,
    private readonly rolesService: RolesService,
    private readonly businessRolesService: BusinessRolesService,
    @InjectQueue(QueueNamesEnum.searchData)
    private readonly searchDataQueue: Queue,
  ) {
    super(businessRepository, userRequest);
  }

  /**
   * Save a new business
   * @param {CreateBusinessInput} data - The business data to save
   * @param {ProvidersEnum} provider - The provider of the business
   * @return {Promise<Business>} - The saved business entity
   * */
  @Transactional()
  async create(
    data: CreateBusinessInput,
    provider: ProvidersEnum,
  ): Promise<Business> {
    data.path = await this.checkBusinessPathExists(
      this.generatePathFromName(data.name)
    );
    data.email = data.email.toLowerCase();

    if (!data.password) data.password = generateRandomCodeByLength(20);
    data.password = await this.hashPassword(data.password);
    data.emailValidated = provider === ProvidersEnum.GOOGLE
      || provider === ProvidersEnum.META
      || provider === ProvidersEnum.APPLE;
    data.provider = provider;
    const business = await this.businessSettersService.create(data);
    delete business.password;
    const role = await this.rolesService.findByCode(data.role);
    const userReq: IBusinessReq = { businessId: business.id, path: business.path };
    await this.businessRolesService.create(business.id, role.id, userReq);
    await this.searchDataQueue.add(
      SearchDataConsumerEnum.SearchDataBusiness,
      { idBusiness: business.id }
    );
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
    if(!id) {
      LogError(this.logger, this._uList.isNotABusiness.message, this.findOne.name);
      throw new NotAcceptableException(this._uList.isNotABusiness);
    }
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
   * @param {UpdateBusinessInput} data - The data to update the business
   * @param {IBusinessReq} business - The business making the request
   * @returns {Promise<Business>} - The updated business entity
   */
  @Transactional()
  async update(
    data: UpdateBusinessInput,
    businessReq: IBusinessReq
  ): Promise<Business> {
    const business = await this.businessesGettersService.findOne(data.id);
    if(data.path && data.path !== business.path) {
      const exist = await this.businessesGettersService.getOneByPath(data.path);
      if(exist) {
        LogError(this.logger, this._uUp.pathExists.message, this.update.name);
        throw new NotAcceptableException(this._uUp.pathExists);
      }
    }
    await this.businessSettersService.update(data, business, businessReq);
    await this.searchDataQueue.add(
      SearchDataConsumerEnum.SearchDataBusiness,
      { idBusiness: business.id }
    );
    return await this.businessesGettersService.findOne(data.id);
  }

  /**
   * Change business password
   * @param {ChangePasswordInput} data - Current and new password
   * @param {IBusinessReq} businessReq - The business making the request
   * @returns {Promise<boolean>}
   */
  async changePassword(data: ChangePasswordInput, businessReq: IBusinessReq): Promise<boolean> {
    const business = await this.businessesGettersService.findOneByIdWithPassword(businessReq.businessId);
    const isCurrentValid = await argon2.verify(business.password, data.currentPassword);
    if (!isCurrentValid) {
      LogError(this.logger, this._uChangePassword.previousInvalid.message, this.changePassword.name);
      throw new NotAcceptableException(this._uChangePassword.previousInvalid);
    }
    const isSame = await argon2.verify(business.password, data.newPassword);
    if (isSame) {
      LogError(this.logger, this._uChangePassword.equalToPrevious.message, this.changePassword.name);
      throw new NotAcceptableException(this._uChangePassword.equalToPrevious);
    }
    const hashedPassword = await this.hashPassword(data.newPassword);
    await this.businessSettersService.updatePassword(business, hashedPassword, businessReq);
    return true;
  }

  /**
   * Remove a business
   * @param {number} id - The ID of the business to remove
   * @returns {Promise<boolean>}
   */
  @Transactional()
  async remove(id: number, businessReq: IBusinessReq): Promise<boolean> {
    const business = await this.businessesGettersService.findOne(id);
    await this.businessSettersService.remove(business, businessReq);
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
  
  /**
   * Generate a URL-friendly path from a business name.
   * - lowercases
   * - removes diacritics (accents)
   * - replaces any non-alphanumeric sequence with a single hyphen
   * - trims leading/trailing hyphens
   * @param {string} name - The business name
   * @returns {string} - The generated path
   */
  private generatePathFromName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
  }

  /**
   * Hash a plain text password using Argon2id.
   * Uses recommended security parameters: 65536 KB memory, 5 iterations, single thread.
   * @param {string} plainPassword - The plain text password to hash
   * @returns {Promise<string>} - The hashed password
   */
  private async hashPassword(plainPassword: string): Promise<string> {
    return argon2.hash(plainPassword, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 5,
      parallelism: 1,
    });
  }
}
