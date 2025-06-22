import { Injectable, Logger, NotAcceptableException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { StatusEnum } from '../../common/enums';
import { BasicService } from '../../common/services';
import { User } from '../../entities';
import { userResponses } from '../../common/responses';
import { UserUniqueFieldsDto } from './dto/unique.dto';
import { LogError } from '../../common/helpers/logger.helper';
import { InfinityScrollDto } from '../../common/dtos';


@Injectable()
export class UsersGettersService extends BasicService<User> {
    private logger: Logger = new Logger(UsersGettersService.name);
    private readonly _uList = userResponses.list;
    private readonly _uToken = userResponses.token;

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
        super(userRepository);
    }

    /**
     * Get all Users
     * @param {InfinityScrollDto} query - query parameters for pagination
     * @returns {Promise<User[]>}
     */
    async findAll(query: InfinityScrollDto): Promise<User[]> {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const order = query.order || 'DESC';
        const orderBy = query.orderBy || 'creation_date';
        return await this.createQueryBuilder('u')
            .where('u.status <> :status', { status: StatusEnum.DELETED })
            .limit(limit)
            .offset(skip)
            .orderBy(`u.${orderBy}`, order)
            .getMany();
    }

    /**
     * Get User by ID
     * @param {number} id - user ID
     * @returns {Promise<User>}
     */
    async findOne(id: number): Promise<User> {
        const user = await this.findOneWithOptionsOrFail({
            where: { id, status: Not(StatusEnum.DELETED) },
        }).catch((error) => {
            LogError(this.logger, error, this.findOne.name);
            throw new NotAcceptableException(this._uList.userNotFound);
        });
        return user;
    }

    /**
     * Find User by email
     * @param {string} email - user email
     * @returns {Promise<User>}
     */
    async findOneByEmail(email: string): Promise<User> {
        return await this.findOneWithOptionsOrFail({
            where: { email: email.toLowerCase(), status: Not(StatusEnum.DELETED) },
        }).catch((error) => {
            LogError(this.logger, error, this.findOneByEmail.name);
            throw new NotAcceptableException(this._uList.userNotFound);
        });
    }

    /**
     * Find a user by mail
     * @param {string} email - email
     * @returns {Promise<User>}
     */
    async findOneByEmailWithPassword(email: string): Promise<User> {
        const user = await this.userRepository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .leftJoinAndSelect('user.userRoles', 'userRoles')
            .leftJoinAndSelect('userRoles.role', 'role')
            .leftJoinAndSelect('role.rolePermissions', 'rolePermissions')
            .leftJoinAndSelect('rolePermissions.permission', 'permission')
            .where('LOWER(user.email) = LOWER(:email)', { email })
            .andWhere('user.status <> :status', { status: StatusEnum.DELETED })
            .getOneOrFail()
            .catch((error) => {
                LogError(this.logger, error, this.findOneByEmailWithPassword.name);
                throw new UnauthorizedException(this._uList.userNotFound);
            });
        if (!user) {
            LogError(this.logger, this._uList.userNotFound, this.findOneByEmailWithPassword.name);
            throw new UnauthorizedException(this._uList.userNotFound);
        }
        return user;
    }

    /**
     * Find User by username
     * @param {string} username - username
     * @returns {Promise<User>}
     */
    async findOneByUsername(username: string): Promise<User> {
        return await this.findOneWithOptionsOrFail({
            where: { username, status: Not(StatusEnum.DELETED) },
        }).catch((error) => {
            LogError(this.logger, error, this.findOneByUsername.name);
            throw new NotAcceptableException(this._uList.userNotFound);
        });
    }

    /**
     * Find User by ID, email and status
     * @param {number} id - user ID
     * @param {string} email - user email
     * @param {StatusEnum} status - user status
     * @returns {Promise<User>}
     */
    async findOneByIdUserAndToken(
        id: number,
        email: string,
        status: StatusEnum
    ): Promise<User> {
        return await this.findOneWithOptionsOrFail({
            where: { id, email, status },
        }).catch((error) => {
            LogError(this.logger, error, this.findOneByIdUserAndToken.name);
            throw new UnauthorizedException(this._uToken.tokenNotValid);
        });
    }

    /**
     * Search Users by username
     * @param {string} username - username
     * @returns {Promise<User[]>}
     */
    async searchUsersByUsername(username: string): Promise<User[]> {
        return await this.userRepository
            .createQueryBuilder('u')
            .where('u.status <> :status', { status: StatusEnum.DELETED })
            .andWhere('u.username iLIKE :username', { username })
            .getMany();
    }

    /**
     * function responsible for the validation of the fields that have to be unique in users
     *
     * @param {UserUniqueFieldsDto} data - unique fields for users
     * @param {*} response - response in case of error
     * @param {number} [id]
     */
    async validateUniqueFields(data: UserUniqueFieldsDto, id?: number) {
        let query = this.userRepository.createQueryBuilder('u');
        if (id) {
            query = query.andWhere('u.id <> :id', { id });
        }
        query = query
            .andWhere('(u.email iLIKE :email', { email: data.email })
            .andWhere('u.status <> :status', { status: StatusEnum.DELETED })
            .orWhere('u.username iLIKE :username)', { username: data.username });

        const user = await query.getOne();
        if (!user) {
            return;
        }
        if (data.username.toLowerCase() === user.username.toLocaleLowerCase()) {
            LogError(
                this.logger,
                this._uList.usernameExists,
                this.validateUniqueFields.name,
                user
            );
            throw new NotAcceptableException(this._uList.usernameExists);
        }

        if (data.email.toLowerCase() === user.email.toLocaleLowerCase()) {
            LogError(
                this.logger,
                this._uList.mailExists,
                this.validateUniqueFields.name,
                user
            );
            throw new NotAcceptableException(this._uList.mailExists);
        }
        throw new NotAcceptableException(this._uList.error);
    }
}
