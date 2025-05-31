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
import { UserRole } from '../../entities';
import { Repository } from 'typeorm';
import { LogError } from '../../common/helpers/logger.helper';
import { userRolesResponses } from '../../common/responses';
import { IUserReq } from '../../common/interfaces';

@Injectable({ scope: Scope.REQUEST })
export class UserRolesService extends BasicService<UserRole> {
  private logger: Logger = new Logger(UserRolesService.name);
  private readonly rCreate = userRolesResponses.create;
  
  constructor(
      @Inject(REQUEST)
      private readonly userRequest: Request,
      @InjectRepository(UserRole)
      private readonly userRoleRepository: Repository<UserRole>
  ) {
      super(userRoleRepository, userRequest);
  }
  
  /**
   * Create a user role
   * @param {number} idUser - The ID of the user
   * @param {number} idRole - The ID of the role
   * @param {IUserReq} user - The user data to save
   */
  async create(idUser: number, idRole: number, user: IUserReq) {
    await this.save({ idUser, idRole }, user).catch((error) => {
        LogError(this.logger, error, this.rCreate.error.message, user);
        throw new InternalServerErrorException(this.rCreate.error);
    });
  }
}
