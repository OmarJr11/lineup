import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogError } from '../../common/helpers/logger.helper';
import { IUserReq } from '../../common/interfaces';
import { BasicService } from '../../common/services';
import { User } from '../../entities';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
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
     * @param {CreateUserInput} data - The data to create a new user 
     * @returns {Promise<User>} 
     */
    async create(data: CreateUserInput): Promise<User> {
        try {
            return await this.save(data);
        } catch (error) {
            LogError(this.logger, error, this.create.name);
            throw new InternalServerErrorException(this._uCreate.error);
        }
    }

    /**
     * Update User
     * @param {UpdateUserInput} data - The data to update the user
     * @param {User} user - The user to update
     * @param {IUserReq} userLogged - The logged user
     * @returns {Promise<User>}
     */
    async update(data: UpdateUserInput, user: User, userLogged: IUserReq): Promise<User> {
        try {
            return await this.updateEntity(data, user, userLogged);
        } catch (error) {
            LogError(this.logger, error, this.update.name);
            throw new InternalServerErrorException(this._ucUpdate.error);
        }
    }

    /**
     * Update user password
     * @param {User} user - The user to update
     * @param {string} hashedPassword - The new hashed password
     * @param {IUserReq} userLogged - The logged user
     * @returns {Promise<User>}
     */
    async updatePassword(user: User, hashedPassword: string, userLogged: IUserReq): Promise<User> {
        try {
            return await this.updateEntity({ password: hashedPassword }, user, userLogged);
        } catch (error) {
            LogError(this.logger, error, this.updatePassword.name);
            throw new InternalServerErrorException(this._ucUpdate.error);
        }
    }

    /**
     * Remove User
     * @param {User} user - The user to remove
     * @param {IUserReq} userLogged - The logged user
     */
    async remove(user: User, userLogged: IUserReq) {
        try {
            return await this.deleteEntityByStatus(user, userLogged);
        } catch (error) {
            LogError(this.logger, error, this.remove.name);
            throw new InternalServerErrorException(this._ucDelete.error);
        }
    }
}
