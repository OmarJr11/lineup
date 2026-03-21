import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { StatusEnum } from '../../common/enums';
import { IAdminTimeSeriesStats, ITimePeriodFilter } from '../../common/interfaces';
import { ITimeSeriesDataPoint, StatisticsQueryHelper } from '../../common/helpers/statistics-query.helper';
import { Catalog, CatalogVisit } from '../../entities';

/**
 * Read-only service for catalog visit queries.
 */
@Injectable()
export class CatalogVisitsGettersService extends BasicService<CatalogVisit> {
    constructor(
        @InjectRepository(CatalogVisit)
        private readonly catalogVisitRepository: Repository<CatalogVisit>,
        @InjectRepository(Catalog)
        private readonly catalogRepository: Repository<Catalog>,
    ) {
        super(catalogVisitRepository);
    }

    /**
     * Get visit count for catalogs of a business, optionally filtered by time period.
     * @param {number} idBusiness - The ID of the business.
     * @param {ITimePeriodFilter} [timePeriod] - The time period filter.
     * @returns {Promise<number>} The visit count.
     */
    async getCountByBusiness(
        idBusiness: number,
        timePeriod?: ITimePeriodFilter,
    ): Promise<number> {
        const qb = this.catalogVisitRepository
            .createQueryBuilder('cv')
            .innerJoin('cv.catalog', 'c')
            .where('c.id_creation_business = :idBusiness', { idBusiness })
            .andWhere('c.status <> :status', { status: StatusEnum.DELETED });
        StatisticsQueryHelper.applyTimeFilter(qb, 'cv', timePeriod);
        return qb.getCount();
    }

    /**
     * Get top catalogs by visits for a business.
     * @param {number} idBusiness - The ID of the business.
     * @param {ITimePeriodFilter} [timePeriod] - The time period filter.
     * @param {number} limit - The limit of the top catalogs.
     * @returns {Promise<{ id: number; title: string; visits: number }[]>} The top catalogs by visits.
     */
    async getTopByVisits(
        idBusiness: number,
        timePeriod?: ITimePeriodFilter,
        limit: number = 10,
    ): Promise<{ id: number; title: string; visits: number }[]> {
        const subQb = this.catalogVisitRepository
            .createQueryBuilder('cv')
            .innerJoin('cv.catalog', 'c')
            .where('c.id_creation_business = :idBusiness', { idBusiness })
            .andWhere('c.status <> :status', { status: StatusEnum.DELETED })
            .select('cv.id_catalog', 'idCatalog')
            .addSelect('COUNT(*)', 'visits')
            .groupBy('cv.id_catalog');
        StatisticsQueryHelper.applyTimeFilter(subQb, 'cv', timePeriod);
        const subQuery = subQb.getQuery();
        const params = subQb.getParameters();
        const rows = await this.catalogRepository
            .createQueryBuilder('c')
            .select('c.id', 'id')
            .addSelect('c.title', 'title')
            .addSelect('COALESCE(sub.visits, 0)', 'visits')
            .innerJoin(`(${subQuery})`, 'sub', 'sub."idCatalog" = c.id')
            .setParameters(params)
            .where('c.id_creation_business = :idBusiness', { idBusiness })
            .andWhere('c.status <> :status', { status: StatusEnum.DELETED })
            .orderBy('visits', 'DESC')
            .limit(limit)
            .getRawMany<{ id: number; title: string; visits: string }>();
        return rows.map((r) => ({
            id: r.id,
            title: r.title,
            visits: parseInt(r.visits ?? '0', 10),
        }));
    }

    /**
     * Get time-series data for catalog visits of a business.
     * @param {number} idBusiness - The ID of the business.
     * @param {ITimePeriodFilter} timePeriod - The time period filter.
     * @returns {Promise<ITimeSeriesDataPoint[]>} The time-series data.
     */
    async getTimeSeriesByBusiness(
        idBusiness: number,
        timePeriod: ITimePeriodFilter,
    ): Promise<ITimeSeriesDataPoint[]> {
        const qb = this.catalogVisitRepository
            .createQueryBuilder('cv')
            .innerJoin('cv.catalog', 'c')
            .where('c.id_creation_business = :idBusiness', { idBusiness })
            .andWhere('c.status <> :status', { status: StatusEnum.DELETED });
        StatisticsQueryHelper.applyTimeFilter(qb, 'cv', timePeriod);
        return StatisticsQueryHelper.getTimeSeriesFromQuery(qb, 'cv', timePeriod);
    }

    /**
     * All catalog visits for non-deleted catalogs (admin statistics).
     * @param {ITimePeriodFilter} [timePeriod] - Optional range and granularity.
     * @returns {Promise<IAdminTimeSeriesStats>} Visit totals and optional series.
     */
    async getGlobalVisitStatsForAdminStatistics(
        timePeriod?: ITimePeriodFilter,
    ): Promise<IAdminTimeSeriesStats> {
        const raw = await StatisticsQueryHelper.computeAggregatedTimeSeries(
            () => this.createQueryBuilder('cv').innerJoin('cv.catalog', 'c').where(
                'c.status <> :catalogStatus',
                { catalogStatus: StatusEnum.DELETED },
            ),
            'cv',
            timePeriod,
        );
        return { total: raw.total, data: raw.data };
    }
}
