import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { BasicService } from '../../common/services';
import { BusinessRole } from '../../entities';
import { Repository } from 'typeorm';
import { LogError } from '../../common/helpers/logger.helper';
import { businessRolesResponses } from '../../common/responses';
import { IUserOrBusinessReq } from '../../common/interfaces';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { BusinessRolesGettersService } from './business-roles-getters.service';

@Injectable({ scope: Scope.REQUEST })
export class BusinessRolesService extends BasicService<BusinessRole> {
  private logger: Logger = new Logger(BusinessRolesService.name);
  private readonly rCreate = businessRolesResponses.create;
  private readonly rDelete = businessRolesResponses.delete;

  constructor(
    @Inject(REQUEST)
    private readonly userRequest: Request,
    @InjectRepository(BusinessRole)
    private readonly businessRoleRepository: Repository<BusinessRole>,
    private readonly businessRolesGettersService: BusinessRolesGettersService
  ) {
    super(businessRoleRepository, userRequest);
  }

  /**
   * Create a business role
   * @param {number} idBusiness - The ID of the business
   * @param {number} idRole - The ID of the role
    * @param {IUserOrBusinessReq} user - The user request object.
    */
  @Transactional()
  async create(idBusiness: number, idRole: number, user: IUserOrBusinessReq) {
    const existing = await this.businessRolesGettersService
      .findOne(idBusiness, idRole);
    if (existing) {
      LogError(this.logger, this.rCreate.alreadyExists.message, this.create.name, user);
      throw new BadRequestException(this.rCreate.alreadyExists);
    }
    try {
      const data = { idBusiness, idRole };
      return await this.save(data, user);
    } catch (error) {
      LogError(this.logger, error, this.rCreate.error.message, user);
      throw new InternalServerErrorException(this.rCreate.error);
    }
  }

  /**
   * Remove a role from a business.
   * @param {number} idBusiness - The business ID.
   * @param {number} idRole - The role ID.
   * @param {IUserOrBusinessReq} user - The user request object.
   */
  @Transactional()
  async removeBusinessRole(idBusiness: number, idRole: number, user: IUserOrBusinessReq) {
    const businessRole = await this.businessRolesGettersService
      .findOneOrFail(idBusiness, idRole);
    try {
      await this.deleteEntity(businessRole, { data: user});
    } catch (error) {
      LogError(this.logger, error, this.rDelete.error.message, user);
      throw new InternalServerErrorException(this.rDelete.error);
    }
  }

  /**
   * Find all roles assigned to a business.
   * @param {number} idBusiness - The business ID.
   * @returns {Promise<BusinessRole[]>} Business roles with role relation.
   */
  async findAllByBusinessId(idBusiness: number): Promise<BusinessRole[]> {
    return await this.businessRolesGettersService.findAllByBusinessId(idBusiness);
  }
}
