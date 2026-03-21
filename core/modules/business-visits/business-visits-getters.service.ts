import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BasicService } from '../../common/services';
import { IAdminTimeSeriesStats, ITimePeriodFilter } from '../../common/interfaces';
import { ITimeSeriesDataPoint, StatisticsQueryHelper } from '../../common/helpers/statistics-query.helper';
import { BusinessVisit } from '../../entities';

/**
 * Read-only service for business visit queries.
 */
@Injectable()
export class BusinessVisitsGettersService extends BasicService<BusinessVisit> {
    constructor(
        @InjectRepository(BusinessVisit)
        private readonly businessVisitRepository: Repository<BusinessVisit>,
    ) {
        super(businessVisitRepository);
    }

    /**
     * Get visit count for a business, optionally filtered by time period.
     * @param {number} idBusiness - The ID of the business.
     * @param {ITimePeriodFilter} [timePeriod] - The time period filter.
     * @returns {Promise<number>} The visit count.
     */
    async getCountByBusiness(
        idBusiness: number,
        timePeriod?: ITimePeriodFilter,
    ): Promise<number> {
        const qb = this.createQueryBuilder('bv')
            .where('bv.id_business = :idBusiness', { idBusiness });
        StatisticsQueryHelper.applyTimeFilter(qb, 'bv', timePeriod);
        return await qb.getCount();
    }

    /**
     * Get visit counts by auth type (anonymous vs identified).
     * @param {number} idBusiness - The ID of the business.
     * @param {ITimePeriodFilter} [timePeriod] - The time period filter.
     * @returns {Promise<{ anonymous: number; identified: number }>} The visit counts by auth type.
     */
    async getCountByAuthType(
        idBusiness: number,
        timePeriod?: ITimePeriodFilter,
    ): Promise<{ anonymous: number; identified: number }> {
        const dateFilter = StatisticsQueryHelper.buildDateFilter('bv', timePeriod);
        const dateParams = StatisticsQueryHelper.getDateParams(timePeriod);
        const baseWhere = 'bv.id_business = :idBusiness';
        const [anonymous, identified] = await Promise.all([
            this.createQueryBuilder('bv')
                .where(baseWhere, { idBusiness })
                .andWhere('bv.id_creation_user IS NULL')
                .andWhere(dateFilter, dateParams)
                .getCount(),
            this.createQueryBuilder('bv')
                .where(baseWhere, { idBusiness })
                .andWhere('bv.id_creation_user IS NOT NULL')
                .andWhere(dateFilter, dateParams)
                .getCount(),
        ]);
        return { anonymous, identified };
    }

    /**
     * Get time-series data for business visits.
     * @param {number} idBusiness - The ID of the business.
     * @param {ITimePeriodFilter} timePeriod - The time period filter.
     * @returns {Promise<ITimeSeriesDataPoint[]>} The time-series data.
     */
    async getTimeSeriesByBusiness(
        idBusiness: number,
        timePeriod: ITimePeriodFilter,
    ): Promise<ITimeSeriesDataPoint[]> {
        const qb = this.createQueryBuilder('bv')
            .where('bv.id_business = :idBusiness', { idBusiness })
            .andWhere(StatisticsQueryHelper.buildDateFilter('bv', timePeriod), StatisticsQueryHelper.getDateParams(timePeriod));
        return StatisticsQueryHelper.getTimeSeriesFromQuery(qb, 'bv', timePeriod);
    }

    /**
     * Get base query builder for business visits (for statistics composition).
     * @param {number} idBusiness - The ID of the business.
     * @param {ITimePeriodFilter} [timePeriod] - The time period filter.
     * @returns {SelectQueryBuilder<BusinessVisit>} The base query builder.
     */
    createBaseQueryBuilder(
        idBusiness: number,
        timePeriod?: ITimePeriodFilter
    ): SelectQueryBuilder<BusinessVisit> {
        const qb = this.createQueryBuilder('bv')
            .where('bv.id_business = :idBusiness', { idBusiness });
        StatisticsQueryHelper.applyTimeFilter(qb, 'bv', timePeriod);
        return qb;
    }

    /**
     * All business visits on the platform (admin statistics).
     * @param {ITimePeriodFilter} [timePeriod] - Optional range and granularity.
     * @returns {Promise<IAdminTimeSeriesStats>} Visit totals and optional series.
     */
    async getGlobalVisitStatsForAdminStatistics(
        timePeriod?: ITimePeriodFilter,
    ): Promise<IAdminTimeSeriesStats> {
        const raw = await StatisticsQueryHelper.computeAggregatedTimeSeries(
            () => this.createQueryBuilder('bv'),
            'bv',
            timePeriod,
        );
        return { total: raw.total, data: raw.data };
    }
}
