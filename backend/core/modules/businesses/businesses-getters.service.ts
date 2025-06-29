import { Injectable, Logger, NotAcceptableException } from '@nestjs/common';
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
        return await this.createQueryBuilder('b')
            .leftJoinAndSelect('b.image', 'image')
            .where('b.status <> :status', { status: StatusEnum.DELETED })
            .limit(limit)
            .offset(skip)
            .orderBy(`b.${orderBy}`, order)
            .getMany();
    }

    /**
     * Get Business by ID
     * @param {number} id - business ID
     * @returns {Promise<Business>}
     */
    async findOne(id: number): Promise<Business> {
        const business = await this.findOneWithOptionsOrFail({
            where: { id, status: Not(StatusEnum.DELETED) },
            relations: ['image'],
        }).catch((error) => {
            LogError(this.logger, error, this.findOne.name);
            throw new NotAcceptableException(this._uList.businessNotFound);
        });
        return business;
    }

    /**
     * Find Business by path
     * @param {string} path - Business path
     * @returns {Promise<Business>}
     */
    async findOneByPath(path: string): Promise<Business> {
        return await this.findOneWithOptionsOrFail({
            where: { 
                path: path.toLocaleLowerCase(),
                status: Not(StatusEnum.DELETED)
            },
        }).catch((error) => {
            LogError(this.logger, error, this.findOneByPath.name);
            throw new NotAcceptableException(this._uList.businessNotFound);
        });
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
}
