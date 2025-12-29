import {
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
import { IBusinessReq } from '../../common/interfaces';
import { Transactional } from 'typeorm-transactional-cls-hooked';

@Injectable({ scope: Scope.REQUEST })
export class BusinessRolesService extends BasicService<BusinessRole> {
  private logger: Logger = new Logger(BusinessRolesService.name);
  private readonly rCreate = businessRolesResponses.create;

  constructor(
    @Inject(REQUEST)
    private readonly userRequest: Request,
    @InjectRepository(BusinessRole)
    private readonly businessRoleRepository: Repository<BusinessRole>
  ) {
    super(businessRoleRepository, userRequest);
  }

  /**
   * Create a business role
   * @param {number} idBusiness - The ID of the business
   * @param {number} idRole - The ID of the role
   * @param {IBusinessReq} business - The business data to save
   */
  @Transactional()
  async create(idBusiness: number, idRole: number, business: IBusinessReq) {
    await this.save({ idBusiness, idRole }, business)
      .catch((error) => {
        LogError(this.logger, error, this.rCreate.error.message, business);
        throw new InternalServerErrorException(this.rCreate.error);
      });
  }
}
