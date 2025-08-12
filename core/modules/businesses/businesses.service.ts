import { Inject, Injectable, Logger } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
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
import { ProvidersEnum } from '../../common/enums';
import { RolesService } from '../roles/roles.service';
import { BusinessRolesService } from '../business-roles/business-roles.service';

@Injectable()
export class BusinessesService extends BasicService<Business> {
  private logger = new Logger(BusinessesService.name);

  constructor(
    @Inject(REQUEST)
    private readonly userRequest: Request,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    private readonly businessesGettersService: BusinessesGettersService,
    private readonly businessSettersService: BusinessesSettersService,
    private readonly rolesService: RolesService,
    private readonly businessRolesService: BusinessRolesService,
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
      data.name.toLocaleLowerCase().replace(/\s+/g, '-')
    );
    data.email = data.email.toLocaleLowerCase();

    if (!data.password) {
      data.password = generateRandomCodeByLength(20);
    }
    data.password = await argon2.hash(data.password, {
      type: argon2.argon2id, // recomendado
      memoryCost: 2 ** 16,   // 65536 KB
      timeCost: 5,           // 5 iteraciones
      parallelism: 1,        // 1 hilo
    });
    data.emailValidated = provider === ProvidersEnum.GOOGLE
      || provider === ProvidersEnum.META
      || provider === ProvidersEnum.APPLE;
    data.provider = provider;
    const business = await this.businessSettersService.create(data);
    delete business.password;
    const role = await this.rolesService.findByCode(data.role);
    const userReq: IBusinessReq = { businessId: business.id, path: business.path };
    await this.businessRolesService.create(business.id, role.id, userReq);
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
   * @param {IBusinessReq} business - The business making the request
   * @returns {Promise<Business>} - The updated business entity
   */
  @Transactional()
  async update(
    id: number,
    data: UpdateBusinessInput,
    businessReq: IBusinessReq
  ): Promise<Business> {
    const business = await this.businessesGettersService.findOne(id);
    if(data.path) {
      data.path = await this.checkBusinessPathExists(
        data.path.toLocaleLowerCase().replace(/\s+/g, '-')
      );
    }
    await this.businessSettersService.update(data, business, businessReq);
    return await this.businessesGettersService.findOne(id);
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
}
