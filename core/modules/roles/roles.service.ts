import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { BasicService } from '../../common/services';
import { Role } from '../../entities';
import { Repository } from 'typeorm';
import { LogError } from '../../common/helpers/logger.helper';
import { roleResponses } from '../../common/responses';
import { RolesCodesEnum } from '../../common/enums';
import { RolesPermissionsCheckerService } from './roles-permissions-checker.service';

@Injectable({ scope: Scope.REQUEST })
export class RolesService extends BasicService<Role> {
  private logger: Logger = new Logger(RolesService.name);
  private readonly rList = roleResponses.list;

  constructor(
    @Inject(REQUEST)
    private readonly userRequest: Request,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly rolesPermissionsChecker: RolesPermissionsCheckerService,
  ) {
    super(roleRepository, userRequest);
  }

  /**
   * Find a role by its code
   * @param {RolesCodesEnum } code - The code of the role to find
   * @returns {Promise<Role>} - The found role
   */
  async findByCode(code: RolesCodesEnum): Promise<Role> {
    return await this.findOneWithOptionsOrFail({ where: { code } })
      .catch((error) => {
        LogError(this.logger, error, this.rList.roleNotFound.message);
        throw new NotFoundException(this.rList.roleNotFound);
      });
  }

  /**
   * Check if user has certain permissions in the system
   *
   * @param {number} idUser - id of the user to verify permissions
   * @param {string[]} codes - permissions code to verify
   * @returns {Promise<boolean>}
   */
  async userHasPermission(idUser: number, codes: string[]): Promise<boolean> {
    return this.rolesPermissionsChecker.userHasPermission(idUser, codes);
  }

  /**
   * Check if business has certain permissions in the system
   *
   * @param {number} idBusiness - id of the business to verify permissions
   * @param {string[]} codes - permissions code to verify
   * @returns {Promise<boolean>}
   */
  async businessHasPermission(idBusiness: number, codes: string[]): Promise<boolean> {
    return this.rolesPermissionsChecker.businessHasPermission(idBusiness, codes);
  }
}
