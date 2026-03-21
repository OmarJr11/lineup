import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { StatusEnum } from '../../common/enums';
import { InfinityScrollInput } from '../../common/dtos';
import { LogError } from '../../common/helpers/logger.helper';
import { businessFollowersResponses } from '../../common/responses';
import { ITimePeriodFilter } from '../../common/interfaces';
import { StatisticsQueryHelper } from '../../common/helpers/statistics-query.helper';
import { Business, BusinessFollower } from '../../entities';

@Injectable()
export class BusinessFollowersGettersService extends BasicService<BusinessFollower> {
    private logger = new Logger(BusinessFollowersGettersService.name);
    private readonly rList = businessFollowersResponses.list;
    private readonly _relations = ['business', 'creationUser'];

    constructor(
      @InjectRepository(BusinessFollower)
      private readonly businessFollowerRepository: Repository<BusinessFollower>,
    ) {
      super(businessFollowerRepository);
    }

    /**
     * Find a business follower by ID.
     * @param {number} id - The business follower ID.
     * @returns {Promise<BusinessFollower>} The found business follower or null.
     */
    async findOne(id: number): Promise<BusinessFollower> {
        try {
            return await this.findOneWithOptionsOrFail({
                where: { id, status: Not(StatusEnum.DELETED) },
                relations: this._relations
            });
        } catch (error) {
            LogError(this.logger, error, this.findOne.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Find a business follower by business ID and user ID.
     * @param {number} idBusiness - The business ID.
     * @param {number} idCreationUser - The user ID.
     * @returns {Promise<BusinessFollower | null>} The found business follower or null.
     */
    async findOneByBusinessAndUser(
        idBusiness: number,
        idCreationUser: number
    ): Promise<BusinessFollower | null> {
        try {
            return await this.findOneWithOptions({
                where: {
                    idBusiness,
                    idCreationUser,
                    status: Not(StatusEnum.DELETED)
                },
                relations: this._relations
            });
        } catch (error) {
            LogError(this.logger, error, this.findOneByBusinessAndUser.name);
            return null;
        }
    }

    /**
     * Get all business followers by business ID.
     * @param {number} idBusiness - The business ID.
     * @returns {Promise<BusinessFollower[]>} Array of business followers.
     */
    async findAllByBusiness(idBusiness: number): Promise<BusinessFollower[]> {
        try {
            return await this.find({
                where: { idBusiness, status: Not(StatusEnum.DELETED) },
                relations: this._relations
            });
        } catch (error) {
            LogError(this.logger, error, this.findAllByBusiness.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Get all businesses followed by a user with pagination (infinite scroll).
     * @param {number} idCreationUser - The user ID.
     * @param {InfinityScrollInput} pagination - Pagination parameters.
     * @returns {Promise<Business[]>} Array of businesses the user follows.
     */
    async findAllByUserPaginated(
        idCreationUser: number,
        pagination: InfinityScrollInput
    ): Promise<Business[]> {
        try {
            const page = pagination.page || 1;
            const limit = pagination.limit || 10;
            const skip = (page - 1) * limit;
            const order = pagination.order || 'DESC';
            const orderBy = pagination.orderBy || 'creation_date';
            const followers = await this.createQueryBuilder('bf')
                .leftJoinAndSelect('bf.business', 'business')
                .leftJoinAndSelect('business.image', 'image')
                .where('bf.idCreationUser = :idCreationUser', { idCreationUser })
                .andWhere('bf.status <> :status', { status: StatusEnum.DELETED })
                .andWhere('business.status <> :statusBusiness', { statusBusiness: StatusEnum.DELETED })
                .orderBy(`bf.${orderBy}`, order)
                .limit(limit)
                .offset(skip)
                .getMany();
            return followers.flatMap((f) => f.business ? [this.formatBusiness(f.business)] : []
            );
        } catch (error) {
            LogError(this.logger, error, this.findAllByUserPaginated.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Count followers by business ID.
     * @param {number} idBusiness - The business ID.
     * @returns {Promise<number>} The count of followers.
     */
    async countByBusiness(idBusiness: number): Promise<number> {
        try {
            return await this.createQueryBuilder('bf')
                .where('bf.idBusiness = :idBusiness', { idBusiness })
                .andWhere('bf.status <> :status', { status: StatusEnum.DELETED })
                .getCount();
        } catch (error) {
            LogError(this.logger, error, this.countByBusiness.name);
            return 0;
        }
    }

    /**
     * Get count for statistics, optionally filtered by time period.
     * 
     * @param {number} idBusiness - The business ID.
     * @param {ITimePeriodFilter} [timePeriod] - The time period filter.
     * @returns {Promise<number>} The count of followers.
     */
    async getCountForStatistics(
        idBusiness: number,
        timePeriod?: ITimePeriodFilter,
    ): Promise<number> {
        const qb = this.createQueryBuilder('bf')
            .where('bf.idBusiness = :idBusiness', { idBusiness })
            .andWhere('bf.status <> :status', { status: StatusEnum.DELETED });
        StatisticsQueryHelper.applyTimeFilter(qb, 'bf', timePeriod);
        return qb.getCount();
    }

    /**
     * Get time-series data for new followers.
     * 
     * @param {number} idBusiness - The business ID.
     * @param {ITimePeriodFilter} timePeriod - The time period filter.
     * @returns {Promise<ITimeSeriesDataPoint[]>} The time-series data.
     */
    async getTimeSeriesForStatistics(
        idBusiness: number,
        timePeriod: ITimePeriodFilter,
    ) {
        const qb = this.createQueryBuilder('bf')
            .where('bf.idBusiness = :idBusiness', { idBusiness })
            .andWhere('bf.status <> :status', { status: StatusEnum.DELETED })
            .andWhere(StatisticsQueryHelper.buildDateFilter('bf', timePeriod), StatisticsQueryHelper.getDateParams(timePeriod));
        return StatisticsQueryHelper.getTimeSeriesFromQuery(qb as any, 'bf', timePeriod);
    }

    /**
     * Format business data (filter deleted locations, remove password).
     * @param {Business} business - Business entity.
     * @returns {Business} Formatted business.
     */
    private formatBusiness(business: Business): Business {
        if (business.password) delete business.password;
        return business;
    }
}
