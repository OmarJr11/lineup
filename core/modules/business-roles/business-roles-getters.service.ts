import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { BasicService } from '../../common/services';
import { BusinessRole } from '../../entities';
import { Repository } from 'typeorm';
import { LogError } from '../../common/helpers/logger.helper';
import { businessRolesResponses } from '../../common/responses';

@Injectable()
export class BusinessRolesGettersService extends BasicService<BusinessRole> {
  private logger: Logger = new Logger(BusinessRolesGettersService.name);
  private readonly rList = businessRolesResponses.list;
  private readonly _relations = ['role'];

  constructor(
    @Inject(REQUEST)
    private readonly userRequest: Request,
    @InjectRepository(BusinessRole)
    private readonly businessRoleRepository: Repository<BusinessRole>,
  ) {
    super(businessRoleRepository, userRequest);
  }

  /**
   * Find a business role by business and role IDs
   * @param {number} idBusiness - The ID of the business
   * @param {number} idRole - The ID of the role
   * @returns {Promise<BusinessRole>} The business role
   */
  async findOne(
    idBusiness: number,
    idRole: number,
  ): Promise<BusinessRole | null> {
    const where = { idBusiness, idRole };
    const relations = this._relations;
    return await this.findOneWithOptions({ where, relations });
  }

  /**
   * Find a business role by business and role IDs or fail
   * @param {number} idBusiness - The ID of the business
   * @param {number} idRole - The ID of the role
   * @returns {Promise<BusinessRole>} The business role
   */
  async findOneOrFail(
    idBusiness: number,
    idRole: number,
  ): Promise<BusinessRole> {
    try {
      const where = { idBusiness, idRole };
      const relations = this._relations;
      return await this.findOneWithOptionsOrFail({ where, relations });
    } catch (error) {
      LogError(this.logger, error, this.findOneOrFail.name);
      throw new NotFoundException(this.rList.notFound);
    }
  }

  /**
   * Find all roles assigned to a business.
   * @param {number} idBusiness - The business ID.
   * @returns {Promise<BusinessRole[]>} Business roles with role relation.
   */
  async findAllByBusinessId(idBusiness: number): Promise<BusinessRole[]> {
    const where = { idBusiness };
    const relations = this._relations;
    return await this.find({ where, relations });
  }
}
