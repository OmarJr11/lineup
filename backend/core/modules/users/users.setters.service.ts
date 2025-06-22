import { Inject, Injectable, InternalServerErrorException, Logger, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { StatusEnum } from '../../common/enums';
import { LogError } from '../../common/helpers/logger.helper';
import { IUserReq } from '../../common/interfaces';
import { BasicService } from '../../common/services';
import { User } from '../../entities';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { userResponses } from '../../common/responses';


@Injectable()
export class UsersSettersService extends BasicService<User> {
    private logger: Logger = new Logger(UsersSettersService.name);
    private readonly _uCreate = userResponses.create;
    private readonly _ucUpdate = userResponses.update;
    private readonly _ucDelete = userResponses.delete;

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
        super(userRepository);
    }
    /**
     * Create User
     * @param {CreateUserDto} data - The data to create a new user 
     * @returns {Promise<User>} 
     */
    async create(data: CreateUserDto): Promise<User> {
        return await this.save(data).catch((error) => {
            LogError(this.logger, error, this._uCreate.error.message);
            throw new InternalServerErrorException(this._uCreate.error);
        });
    }

    /**
     * Update User
     * @param {UpdateUserDto} data - The data to update the user
     * @param {User} user - The user to update
     * @param {IUserReq} userLogged - The logged user
     * @returns {Promise<User>}
     */
    async update(data: UpdateUserDto, user: User, userLogged: IUserReq): Promise<User> {
        return await this.updateEntity(data, user, userLogged).catch((error) => {
            LogError(this.logger, error, this._ucUpdate.error.message);
            throw new InternalServerErrorException(this._ucUpdate.error);
        });
    }

    /**
     * Remove User
     * @param {User} user - The user to remove
     * @param {IUserReq} userLogged - The logged user
     */
    async remove(user: User, userLogged: IUserReq) {
        await this.deleteEntityByStatus(user, userLogged).catch((error) => {
            LogError(this.logger, error, this._ucDelete.error.message);
            throw new InternalServerErrorException(this._ucDelete.error);
        });
    }
}
