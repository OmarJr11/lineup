import { ForbiddenException, Inject, Injectable, InternalServerErrorException, Logger, NotAcceptableException, Scope } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { BasicService } from '../../common/services';
import { User } from '../../entities';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderEnum, StatusEnum } from '../../common/enum';
import { generateRandomCodeByLength } from '../../common/helpers/generators.helper';
import { UserUniqueFieldsDto } from './dto/unique.dto';
import { userResponses } from '../../common/responses';
import * as argon2 from 'argon2';
import { LogError } from '../../common/helpers/logger.helper';
import { RolesService } from '../roles/roles.service';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { UserRolesService } from '../user-roles/user-roles.service';
import { IUserReq } from '../../common/interfaces';

@Injectable({ scope: Scope.REQUEST })
export class UsersService extends BasicService<User> {
    private readonly logger = new Logger(UsersService.name);
    private readonly rCreate = userResponses.create;
    private readonly rUpdate = userResponses.update;
    private readonly rList = userResponses.list;

    constructor(
        @Inject(REQUEST)
        private readonly userRequest: Request,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly rolesService: RolesService,
        private readonly userRolesService: UserRolesService,
        //private readonly usersGettersService: UsersGettersService,
    ) {
        super(userRepository, userRequest);
    }

    @Transactional()
    async create(
        data: CreateUserDto,
        isSocial?: boolean
    ): Promise<User> {
        console.log('Creating user with data:', data);
        if (!data.username) {
            data.username = await this.generateUsername(data.firstName, data.lastName);
        }
        data.username = data.username.toLocaleLowerCase();
        if (data.username && data.username !== undefined && data.username.length > 2) {
            const reg = new RegExp('^(?=.{2,50}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._-]+(?<![_.])$');
            if (!reg.test(data.username)) {
                throw new ForbiddenException(this.rCreate.usernameNotValid);
            }
        }
        data.mail = data.mail.toLocaleLowerCase();
        this.validateEqualUserEmail(
            { username: data.username, mail: data.mail },
            this.rCreate.usernameNotValid
        );
        await this.validateUniqueFields({ username: data.username, mail: data.mail }, this.rCreate);

        if (!data.provider) {
            data.provider = ProviderEnum.LINE_UP;
        }
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
        data.emailValidated = isSocial ? true : false;

        const user = await this.save(data).catch((error) => {
            LogError(this.logger, error, this.rCreate.error.message);
            throw new InternalServerErrorException(this.rCreate.error);
        });
        delete user.password;

        const role = await this.rolesService.findByCode(data.role);
        const userReq: IUserReq = { userId: user.id, username: user.username }
        await this.userRolesService.create(user.id, role.id, userReq);
        /*
        if (!isSocial) {
            await this.sendEmailCode(user, lang ? lang : user.language);
        } else {
            await this.sendEmailWelcome(user, lang ? lang : user.language);
        }*/

        return user;
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
     *  Check if the username has a '@', then it must be the same email
     *
     * @param {{username:string,mail:string}} data - Parameter to create or update the user
     * @param {*} completeResponse - Parameter to create or update the user
     * @returns {void}
     */
    private validateEqualUserEmail(
        data: { username: string; mail: string },
        completeResponse: any
    ): void {
        if (data.username.includes('@') && data.username !== data.mail) {
            throw new NotAcceptableException(completeResponse);
        }
    }

    /**
     * function responsible for the validation of the fields that have to be unique in users
     *
     * @param {UserUniqueFieldsDto} data - unique fields for users
     * @param {*} response - response in case of error
     * @param {number} [id]
     */
    private async validateUniqueFields(data: UserUniqueFieldsDto, response: any, id?: number) {
        let query = this.userRepository.createQueryBuilder('u');
        if (id) {
            query = query.andWhere('u.id <> :id', { id });
        }
        query = query
            .andWhere('(u.mail iLIKE :mail', { mail: data.mail })
            .andWhere('u.status <> :status', { status: StatusEnum.DELETED })
            .orWhere('u.username iLIKE :username)', { username: data.username });

        const user = await query.getOne();
        if (!user) {
            return;
        }
        if (data.username.toLowerCase() === user.username.toLocaleLowerCase()) {
            throw new NotAcceptableException(response.usernameExists);
        }

        if (data.mail.toLowerCase() === user.mail.toLocaleLowerCase()) {
            throw new NotAcceptableException(response.mailExists);
        }
        throw new NotAcceptableException(response.documentExists);
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
        const users = await this.searchUsersByUsername(search);

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
}
