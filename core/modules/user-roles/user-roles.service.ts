import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
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
import { UserRolesGettersService } from './user-roles-getters.service';
import { Transactional } from 'typeorm-transactional-cls-hooked';

@Injectable({ scope: Scope.REQUEST })
export class UserRolesService extends BasicService<UserRole> {
  private logger: Logger = new Logger(UserRolesService.name);
  private readonly rCreate = userRolesResponses.create;
  private readonly rDelete = userRolesResponses.delete;

  constructor(
    @Inject(REQUEST)
    private readonly userRequest: Request,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly userRolesGettersService: UserRolesGettersService 
  ) {
    super(userRoleRepository, userRequest);
  }

  /**
   * Create a user role
   * @param {number} idUser - The ID of the user
   * @param {number} idRole - The ID of the role
   * @param {IUserReq} user - The user data to save
   */
  @Transactional()
  async create(idUser: number, idRole: number, user: IUserReq) {
    const existing = await this.userRolesGettersService.findOne(idUser, idRole);
    if (existing) {
      LogError(this.logger, this.rCreate.alreadyExists.message, this.create.name, user);
      throw new BadRequestException(this.rCreate.alreadyExists);
    }
    try {
      return await this.save({ idUser, idRole }, user);
    } catch (error) {
      LogError(this.logger, error, this.rCreate.error.message, user);
      throw new InternalServerErrorException(this.rCreate.error);
    }
  }

  /**
   * Remove a role from a user.
   * @param {number} idUser - The user ID.
   * @param {number} idRole - The role ID.
   * @param {IUserReq} user - The user request object.
   */
  @Transactional()
  async removeUserRole(idUser: number, idRole: number, user: IUserReq) {
    const userRole = await this.userRolesGettersService.findOneOrFail(idUser, idRole);
    try {
      await this.deleteEntity(userRole, { data: user});
    } catch (error) {
      LogError(this.logger, error, this.rDelete.error.message, user);
      throw new InternalServerErrorException(this.rDelete.error);
    }
  }

  /**
   * Find all roles assigned to a user.
   * @param {number} idUser - The user ID.
   * @returns {Promise<UserRole[]>} User roles with role relation.
   */
  async findAllByUserId(idUser: number): Promise<UserRole[]> {
    return await this.userRolesGettersService.findAllByUserId(idUser);
  }
}
