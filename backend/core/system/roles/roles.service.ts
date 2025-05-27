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
import { RolesEnum } from '../../common/enum';

@Injectable({ scope: Scope.REQUEST })
export class RolesService extends BasicService<Role> {
  private logger: Logger = new Logger(RolesService.name);
  private readonly rList = roleResponses.list;
  
  constructor(
      @Inject(REQUEST)
      private readonly userRequest: Request,
      @InjectRepository(Role)
      private readonly roleRepository: Repository<Role>
  ) {
      super(roleRepository, userRequest);
  }

  /**
   * Find a role by its code
   * @param {RolesEnum } code - The code of the role to find
   * @returns {Promise<Role>} - The found role
   */
  async findByCode(code: RolesEnum ): Promise<Role> {
    return await this.findOneWithOptionsOrFail({where: { code }})
      .catch((error) => {
        LogError(this.logger, error, this.rList.roleNotFound.message);
        throw new NotFoundException(this.rList.roleNotFound);
      });
  }
}
