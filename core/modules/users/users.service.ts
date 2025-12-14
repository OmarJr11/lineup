import { ForbiddenException, Inject, Injectable, Logger, NotAcceptableException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { IUserReq } from '../../common/interfaces';
import { BasicService } from '../../common/services';
import { User } from '../../entities';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UsersSettersService } from './users.setters.service';
import { UsersGettersService } from './users.getters.service';
import { userResponses } from '../../common/responses';
import { generateRandomCodeByLength } from '../../common/helpers/generators.helper';
import { ProvidersEnum, RolesCodesEnum } from '../../common/enums';
import * as argon2 from 'argon2';
import { LogError } from '../../common/helpers/logger.helper';
import { RolesService } from '../roles/roles.service';
import { UserRolesService } from '../user-roles/user-roles.service';
import { InfinityScrollInput } from '../../common/dtos';

@Injectable({ scope: Scope.REQUEST })
export class UsersService extends BasicService<User> {
  private logger: Logger = new Logger(UsersSettersService.name);
  private readonly _uCreate = userResponses.create;
  private readonly _uUpdate = userResponses.update;
  private readonly _uList = userResponses.list;

  constructor(
    @Inject(REQUEST)
    private readonly userRequest: Request,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly usersSettersService: UsersSettersService,
    private readonly usersGettersService: UsersGettersService,
    private readonly rolesService: RolesService,
    private readonly userRolesService: UserRolesService
  ) {
    super(userRepository, userRequest);
  }

  /**
   * Create User
   * @param {CreateUserInput} data - The data to create a new user 
   * @param {ProvidersEnum} provider - The provider of the user (e.g., Google, Meta, Apple)
   * @param {boolean} isAdmin - Indicates if the user is an admin
   * @returns {Promise<User>} 
   */
  @Transactional()
  async create(
    data: CreateUserInput,
    provider: ProvidersEnum,
    isAdmin?: boolean
  ): Promise<User> {
    if (
      isAdmin &&
      (
        data.role !== RolesCodesEnum.ADMIN &&
        data.role !== RolesCodesEnum.MODERATOR
      )
    ) {
      LogError(this.logger, this._uCreate.noPermission.message, this.create.name);
      throw new NotAcceptableException(this._uCreate.noPermission);
    }

    if (!data.username) {
      data.username = await this.generateUsername(data.firstName, data.lastName);
    }

    data.email = data.email.toLocaleLowerCase();
    data.username = data.username.toLocaleLowerCase();

    if (data.username && data.username !== undefined && data.username.length > 2) {
      const reg = new RegExp('^(?=.{2,50}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._-]+(?<![_.])$');
      if (!reg.test(data.username)) {
        LogError(this.logger, this._uCreate.usernameNotValid.message, this.create.name);
        throw new ForbiddenException(this._uCreate.usernameNotValid);
      }
    }

    this.validateEqualUserEmail(
      { username: data.username, email: data.email },
      this._uCreate.usernameNotValid
    );
    await this.usersGettersService.validateUniqueFields(
      { username: data.username, email: data.email }
    );

    if (!data.password) {
      data.password = generateRandomCodeByLength(20);
    }

    //data.imgCode = await this.validateImage(data.imgCode);
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

    const user = await this.usersSettersService.create(data);
    delete user.password;

    const role = await this.rolesService.findByCode(data.role);
    const userReq: IUserReq = { userId: user.id, username: user.username }
    await this.userRolesService.create(user.id, role.id, userReq);

    return user;
  }

  /**
   * Find all Users
   * @param {InfinityScrollDto} query - The query parameters for pagination and filtering
   * @returns {Promise<User[]>} 
   */
  async findAll(query: InfinityScrollInput): Promise<User[]> {
    return await this.usersGettersService.findAll(query);
  }

  /**
   * Find User by ID
   * @param {number} id - The ID of the user to find
   * @returns {Promise<User>} 
   */
  async findOne(id: number): Promise<User> {
    if(!id) {
      LogError(this.logger, this._uList.isNotAUser.message, this.findOne.name);
      throw new NotAcceptableException(this._uList.isNotAUser);
    }
    return await this.usersGettersService.findOne(id);
  }

  /**
   * Update User
   * @param {UpdateUserInput} data - The data to update the user
   * @param {IUserReq} user - The user making the request
   * @returns {Promise<User>} 
   */
  async update(data: UpdateUserInput, user: IUserReq): Promise<User> {
    const userToUpdate = await this.usersGettersService.findOne(data.id);
    await this.validateUserId(data.id, user);
    data.username = data.username?.toLowerCase();
    const exist = await this.usersGettersService.findByUsername(data.username);
    if (
      data.username &&
      !!exist
    ) {
      LogError(this.logger, this._uUpdate.usernameExists, this.update.name, user);
      throw new NotAcceptableException(this._uUpdate.usernameExists);
    }
    await this.usersSettersService.update(data, userToUpdate, user);
    return await this.usersGettersService.findOne(data.id);
  }

  /**
   * Remove User
   * @param {number} id - The ID of the user to remove
   * @param {IUserReq} user - The user making the request
   */
  async remove(id: number, user: IUserReq) {
    const userToDelete = await this.usersGettersService.findOne(id);
    await this.validateUserId(id, user);
    await this.usersSettersService.remove(userToDelete, user);
  }

  /**
   * This function is responsible for generating a username using the user's first and last names
   * @param {string} firstName - firstName of the user
   * @param {string} lastName - lastName of the user
   * @returns {Promise<string>}
   */
  private async generateUsername(firstName: string, lastName?: string): Promise<string> {
    const names = this.filterNames(firstName.toLowerCase(), lastName?.toLowerCase());
    let username = names;
    const search = '%' + names + '%';
    const users = await this.usersGettersService.searchUsersByUsername(search);

    let i = 0;
    users.map((user) => {
      i = this.existUsername(user.username, username) ? i + 1 : i;
    });

    if (i > 0) {
      username = i < 10 ? username + '-0' + i : username + '-' + i;
    }
    return username;
  }

  /**
   * Filter the names of user
   * @param {string} firstName - firstName of the user
   * @param {string} lastName - lastName of the user
   * @returns {string}
   */
  private filterNames(firstName: string, lastName?: string): string {
    let names = lastName ? firstName + ' ' + lastName : firstName;
    names = this.filterAccents(names);
    names = names.replace(/[^a-zA-Z ]/g, '');
    names = names.replace(/\s/g, '-');
    return names;
  }

  /**
   * Check if exist the username
   * @param {string} username - username in the db
   * @param {string} newUsername - username of the new user
   * @returns {boolean}
   */
  private existUsername(username: string, newUsername: string): boolean {
    const subCad = username.slice(0, newUsername.length);
    return subCad === newUsername;
  }

  /**
   * Filter Accents and Ñ of username
   * @param {string} username - username to register
   * @returns {string}
   */
  private filterAccents(username: string): string {
    const accents = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ñ: 'n' };
    return username
      .split('')
      .map((l) => accents[l] || l)
      .join('')
      .toString();
  }

  /**
   *  Check if the username has a '@', then it must be the same email
   *
   * @param {{username:string,mail:string}} data - Parameter to create or update the user
   * @param {*} completeResponse - Parameter to create or update the user
   * @returns {void}
   */
  private validateEqualUserEmail(
    data: { username: string; email: string },
    completeResponse: any
  ): void {
    if (data.username.includes('@') && data.username !== data.email) {
      throw new NotAcceptableException(completeResponse);
    }
  }

  /**
   * Validate if the userId is the same as the id of the user in the request
   * @param {number} id - The ID of the user to validate
   * @param {IUserReq} user - The user making the request
   */
  async validateUserId(id: number, user: IUserReq) {
    if (Number(id) !== Number(user.userId)) {
      LogError(this.logger, this._uUpdate.noPermission.message, this.remove.name, user);
      throw new ForbiddenException(this._uUpdate.noPermission);
    }
  }
}
