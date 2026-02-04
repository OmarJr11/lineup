import { Injectable, Logger, NotAcceptableException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { StatusEnum } from '../../common/enums';
import { BasicService } from '../../common/services';
import { Business } from '../../entities';
import { businessesResponses } from '../../common/responses';
import { LogError } from '../../common/helpers/logger.helper';
import { InfinityScrollInput } from '../../common/dtos';


@Injectable()
export class BusinessesGettersService extends BasicService<Business> {
    private logger: Logger = new Logger(BusinessesGettersService.name);
    private readonly _uList = businessesResponses.list;
    private readonly _uToken = businessesResponses.token;
    private readonly _relations = ['image', 'locations', 'businessFollowers'];

    constructor(
        @InjectRepository(Business)
        private readonly businessRepository: Repository<Business>,
    ) {
        super(businessRepository);
    }

    /**
     * Get all Businesses with pagination
     * @param {InfinityScrollInput} query - query parameters for pagination
     * @returns {Promise<Business[]>}
     */
    async findAll(query: InfinityScrollInput): Promise<Business[]> {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const order = query.order || 'DESC';
        const orderBy = query.orderBy || 'creation_date';
        const businesses = await this.createQueryBuilder('b')
            .leftJoinAndSelect('b.image', 'image')
            .leftJoinAndSelect(
                'b.locations', 'locations', 'locations.status <> :locationStatus',
                { locationStatus: StatusEnum.DELETED }
            )
            .leftJoinAndSelect('b.businessFollowers', 'businessFollowers')
            .where('b.status <> :status', { status: StatusEnum.DELETED })
            .limit(limit)
            .offset(skip)
            .orderBy(`b.${orderBy}`, order)
            .getMany();
        return this.formatBusinesses(businesses);
    }

    /**
     * Get Business by ID
     * @param {number} id - business ID
     * @returns {Promise<Business>}
     */
    async findOne(id: number): Promise<Business> {
        const business = await this.findOneWithOptionsOrFail({
            where: { id, status: Not(StatusEnum.DELETED) },
            relations: this._relations,
        }).catch((error) => {
            LogError(this.logger, error, this.findOne.name);
            throw new NotAcceptableException(this._uList.businessNotFound);
        });
        return this.formatBusiness(business);
    }

    /**
     * Find Business by path
     * @param {string} path - Business path
     * @returns {Promise<Business>}
     */
    async findOneByPath(path: string): Promise<Business> {
        const business = await this.findOneWithOptionsOrFail({
            where: { 
                path: path.toLocaleLowerCase(),
                status: Not(StatusEnum.DELETED)
            },
            relations: this._relations,
        }).catch((error) => {
            LogError(this.logger, error, this.findOneByPath.name);
            throw new NotAcceptableException(this._uList.businessNotFound);
        });
        return this.formatBusiness(business);
    }

    /**
     * Get Business by path
     * @param {string} path - Business path
     * @returns {Promise<Business>}
     */
    async getOneByPath(path: string): Promise<Business> {
        return await this.findOneWithOptions({
            where: { 
                path: path.toLocaleLowerCase(), 
                status: Not(StatusEnum.DELETED)
            },
        });
    }

    /**
     * Search Businesses by path
     * @param {string} path - Business path
     * @returns {Promise<Business[]>}
     */
    async searchBusinessesByPath(path: string): Promise<Business[]> {
        return await this.businessRepository
            .createQueryBuilder('b')
            .where('b.status <> :status', { status: StatusEnum.DELETED })
            .andWhere('b.path iLIKE :path', { path: `%${path}%` })
            .getMany();
    }

    /**
     * Find a user by mail
     * @param {string} email - email
     * @returns {Promise<User>}
     */
    async findOneByEmailWithPassword(email: string): Promise<Business> {
        const business = await this.businessRepository
            .createQueryBuilder('business')
            .addSelect('business.password')
            .leftJoinAndSelect('business.businessRoles', 'businessRoles')
            .leftJoinAndSelect('businessRoles.role', 'role')
            .leftJoinAndSelect('role.rolePermissions', 'rolePermissions')
            .leftJoinAndSelect('rolePermissions.permission', 'permission')
            .where('LOWER(business.email) = LOWER(:email)', { email })
            .andWhere('business.status <> :status', { status: StatusEnum.DELETED })
            .getOneOrFail()
            .catch((error) => {
                LogError(this.logger, error, this.findOneByEmailWithPassword.name);
                throw new UnauthorizedException(this._uList.businessNotFound);
            });
        if (!business) {
            LogError(this.logger, this._uList.businessNotFound, this.findOneByEmailWithPassword.name);
            throw new UnauthorizedException(this._uList.businessNotFound);
        }
        return business;
    }

    /**
     * Find User by ID, email and status
     * @param {number} id - user ID
     * @param {string} email - user email
     * @param {StatusEnum} status - user status
     * @returns {Promise<Business>}
     */
    async findOneByIdBusinessAndToken(
        id: number,
        email: string,
        status: StatusEnum
    ): Promise<Business> {
        return await this.findOneWithOptionsOrFail({
            where: { id, email, status },
        }).catch((error) => {
            LogError(this.logger, error, this.findOneByIdBusinessAndToken.name);
            throw new UnauthorizedException(this._uToken.tokenNotValid);
        });
    }
    
    /**
     * Format Business data
     * @param {Business} business - Business entity
     * @returns {Business} - Formatted Business entity
     */
    private formatBusiness(business: Business): Business {
        if(business.locations && business.locations.length > 0) {
            business.locations = business.locations
                .filter(location => location.status !== StatusEnum.DELETED);
        }
        if(business.password) delete business?.password;
        return business;
    }

    /**
     * Format Businesses data
     * @param {Business[]} businesses - Array of Business entities
     * @returns {Business[]} - Array of Formatted Business entities
     */
    private formatBusinesses(businesses: Business[]): Business[] {
        return businesses.map(business => this.formatBusiness(business));
    }
}
