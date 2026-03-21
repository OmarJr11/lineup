import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { ProductVisit } from '../../entities';
import { StatusEnum } from '../../common/enums';
import { IProductVisitsData } from '../business-statistics/interfaces';
import { IAdminTimeSeriesStats, ITimePeriodFilter } from '../../common/interfaces';
import { StatisticsQueryHelper } from '../../common/helpers/statistics-query.helper';

/** Default limit for tag IDs returned from visited products. */
const DEFAULT_TAG_IDS_LIMIT = 10;

/**
 * Getters service for product visits.
 * Handles read operations related to product visit data.
 */
@Injectable()
export class ProductVisitsGettersService extends BasicService<ProductVisit> {
    constructor(
        @InjectRepository(ProductVisit)
        private readonly productVisitRepository: Repository<ProductVisit>,
    ) {
        super(productVisitRepository);
    }

    /**
     * Gets distinct tag IDs from products the user has visited.
     * Excludes deleted products.
     * @param {number} idUser - The user ID.
     * @param {number} [limit=DEFAULT_TAG_IDS_LIMIT] - Max number of tag IDs to return.
     * @returns {Promise<number[]>} Array of tag IDs.
     */
    async getTagIdsFromVisitedProducts(
        idUser: number,
        limit: number = DEFAULT_TAG_IDS_LIMIT,
    ): Promise<number[]> {
        const rows = await this.createQueryBuilder('pv')
            .innerJoin('pv.product', 'p', 'p.status <> :status', {
                status: StatusEnum.DELETED,
            })
            .innerJoin('p.productTags', 'pt')
            .innerJoin('pt.tag', 't')
            .where('pv.idCreationUser = :idUser', { idUser })
            .select('t.id', 'idTag')
            .orderBy('t.id')
            .getRawMany<{ idTag: string }>();
        const allIds = (rows ?? [])
            .map((r) => Number(r?.idTag))
            .filter((id): id is number => !Number.isNaN(id));
        const uniqueIds = [...new Set(allIds)];
        return uniqueIds.slice(0, limit);
    }

    /**
     * Get top products by visits for a business (for statistics).
     * @param {number} idBusiness - The ID of the business.
     * @param {ITimePeriodFilter} timePeriod - The time period filter.
     * @param {number} limit - The limit of the top products.
     * @returns {Promise<{ idProduct: number; visits: number }[]>} The top products by visits.
     */
    async getTopProductsByVisits(
        idBusiness: number,
        timePeriod: ITimePeriodFilter | undefined,
        limit: number,
    ): Promise<IProductVisitsData[]> {
        const subQb = this.createQueryBuilder('pv')
            .innerJoin('pv.product', 'p')
            .where('p.id_creation_business = :idBusiness', { idBusiness })
            .andWhere('p.status <> :status', { status: StatusEnum.DELETED })
            .select('pv.id_product', 'idProduct')
            .addSelect('COUNT(*)', 'visits')
            .groupBy('pv.id_product');
        StatisticsQueryHelper.applyTimeFilter(subQb, 'pv', timePeriod);
        const subQuery = subQb.getQuery();
        const params = subQb.getParameters();
        const rows = await this.productVisitRepository.manager
            .createQueryBuilder()
            .select('sub."idProduct"', 'idProduct')
            .addSelect('sub.visits', 'visits')
            .from(`(${subQuery})`, 'sub')
            .setParameters(params)
            .orderBy('visits', 'DESC')
            .limit(limit)
            .getRawMany<{ idProduct: number; visits: string }>();
        return rows.map((r) => ({
            idProduct: r.idProduct,
            visits: parseInt(r.visits ?? '0', 10),
        }));
    }

    /**
     * Get visit count for products (for statistics).
     */
    async getVisitCountByProductIds(
        productIds: number[],
        timePeriod?: ITimePeriodFilter,
    ): Promise<number> {
        if (productIds.length === 0) return 0;
        const qb = this.createQueryBuilder('pv')
            .where('pv.id_product IN (:...productIds)', { productIds })
            .select('COUNT(*)', 'count');
        StatisticsQueryHelper.applyTimeFilter(qb, 'pv', timePeriod);
        const result = await qb.getRawOne<{ count: string }>();
        return parseInt(result?.count ?? '0', 10);
    }

    /**
     * All product visits for non-deleted products (admin statistics).
     * @param {ITimePeriodFilter} [timePeriod] - Optional range and granularity.
     * @returns {Promise<IAdminTimeSeriesStats>} Visit totals and optional series.
     */
    async getGlobalVisitStatsForAdminStatistics(
        timePeriod?: ITimePeriodFilter,
    ): Promise<IAdminTimeSeriesStats> {
        const raw = await StatisticsQueryHelper.computeAggregatedTimeSeries(
            () => this.createQueryBuilder('pv').innerJoin('pv.product', 'p').where(
                'p.status <> :productStatus',
                { productStatus: StatusEnum.DELETED },
            ),
            'pv',
            timePeriod,
        );
        return { total: raw.total, data: raw.data };
    }
}
