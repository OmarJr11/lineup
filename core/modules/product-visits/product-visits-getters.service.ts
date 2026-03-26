import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BasicService } from '../../common/services';
import { ProductVisit } from '../../entities';
import { StatusEnum } from '../../common/enums';
import { IProductVisitsData } from '../business-statistics/interfaces';
import {
  IAdminTimeSeriesStats,
  ITimePeriodFilter,
} from '../../common/interfaces';

/** Physical `creation_date` column for alias `pv`. */
const PV_CREATION = '"pv"."creation_date"';

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
   * Inclusive local-calendar bounds (server TZ) for ISO start/end.
   * @param {string} startIso - Range start.
   * @param {string} endIso - Range end.
   * @returns {{ start: Date; end: Date }} Bounds for the driver.
   */
  private boundsToLocalCalendarInclusive(
    startIso: string,
    endIso: string,
  ): { start: Date; end: Date } {
    const s = new Date(startIso);
    const e = new Date(endIso);
    const start = new Date(
      s.getFullYear(),
      s.getMonth(),
      s.getDate(),
      0,
      0,
      0,
      0,
    );
    const end = new Date(
      e.getFullYear(),
      e.getMonth(),
      e.getDate(),
      23,
      59,
      59,
      999,
    );
    return { start, end };
  }

  /**
   * Appends inclusive `creation_date` filter when both bounds exist.
   * @param {SelectQueryBuilder<ProductVisit>} qb - Builder with alias `pv`.
   * @param {ITimePeriodFilter} [timePeriod] - Optional range.
   */
  private appendCreationDateRange(
    qb: SelectQueryBuilder<ProductVisit>,
    timePeriod?: ITimePeriodFilter,
  ): void {
    if (!timePeriod?.startDate || !timePeriod?.endDate) {
      return;
    }
    const { start, end } = this.boundsToLocalCalendarInclusive(
      timePeriod.startDate,
      timePeriod.endDate,
    );
    qb.andWhere(
      `${PV_CREATION} >= :pvRangeStart AND ${PV_CREATION} <= :pvRangeEnd`,
      { pvRangeStart: start, pvRangeEnd: end },
    );
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
   * Get products by visits for a business (for statistics), ordered by visit count descending.
   * @param {number} idBusiness - The ID of the business.
   * @param {ITimePeriodFilter} timePeriod - The time period filter.
   * @returns {Promise<{ idProduct: number; visits: number }[]>} Products with visit totals.
   */
  async getTopProductsByVisits(
    idBusiness: number,
    timePeriod: ITimePeriodFilter | undefined,
  ): Promise<IProductVisitsData[]> {
    const subQb = this.createQueryBuilder('pv')
      .innerJoin('pv.product', 'p')
      .where('p.id_creation_business = :idBusiness', { idBusiness })
      .andWhere('p.status <> :status', { status: StatusEnum.DELETED })
      .select('pv.idProduct', 'idProduct')
      .addSelect('COUNT(*)', 'visits')
      .groupBy('pv.idProduct');
    this.appendCreationDateRange(subQb, timePeriod);
    const subQuery = subQb.getQuery();
    const params = subQb.getParameters();
    const rows = await this.productVisitRepository.manager
      .createQueryBuilder()
      .select('sub."idProduct"', 'idProduct')
      .addSelect('sub.visits', 'visits')
      .from(`(${subQuery})`, 'sub')
      .setParameters(params)
      .orderBy('visits', 'DESC')
      .limit(10)
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
    this.appendCreationDateRange(qb, timePeriod);
    const result = await qb.getRawOne<{ count: string }>();
    return parseInt(result?.count ?? '0', 10);
  }

  /**
   * Count product visits for non-deleted products (admin statistics).
   * With `startDate` and `endDate`, counts rows whose `creation_date` lies in that inclusive range; otherwise counts all such visits.
   * @param {ITimePeriodFilter} [timePeriod] - Optional date bounds.
   * @returns {Promise<IAdminTimeSeriesStats>} Total visits only (`data` is never set).
   */
  async getGlobalVisitStatsForAdminStatistics(
    timePeriod?: ITimePeriodFilter,
  ): Promise<IAdminTimeSeriesStats> {
    const qb = this.createQueryBuilder('pv')
      .innerJoin('pv.product', 'p')
      .where('p.status <> :productStatus', {
        productStatus: StatusEnum.DELETED,
      });
    if (timePeriod?.startDate && timePeriod?.endDate) {
      qb.andWhere(
        'pv.creationDate >= :startDate AND pv.creationDate <= :endDate',
        {
          startDate: timePeriod.startDate,
          endDate: timePeriod.endDate,
        },
      );
    }
    const total = await qb.getCount();
    return { total };
  }
}
