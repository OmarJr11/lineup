import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BasicService } from '../../common/services';
import { StatusEnum } from '../../common/enums';
import {
  IAdminTimeSeriesStats,
  ITimePeriodFilter,
} from '../../common/interfaces';
import { Catalog, CatalogVisit } from '../../entities';

/** Physical `creation_date` column for alias `cv`. */
const CV_CREATION = '"cv"."creation_date"';

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
   * Appends inclusive `creation_date` range when both bounds exist.
   * @param {SelectQueryBuilder<CatalogVisit>} qb - Builder with alias `cv`.
   * @param {ITimePeriodFilter} [timePeriod] - Optional range.
   */
  private appendCreationDateRange(
    qb: SelectQueryBuilder<CatalogVisit>,
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
      `${CV_CREATION} >= :cvRangeStart AND ${CV_CREATION} <= :cvRangeEnd`,
      { cvRangeStart: start, cvRangeEnd: end },
    );
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
    this.appendCreationDateRange(qb, timePeriod);
    return qb.getCount();
  }

  /**
   * Get catalogs by visits for a business, ordered by visit count descending.
   * @param {number} idBusiness - The ID of the business.
   * @param {ITimePeriodFilter} [timePeriod] - The time period filter.
   * @returns {Promise<{ id: number; title: string; visits: number }[]>} Catalogs with visit totals.
   */
  async getTopByVisits(
    idBusiness: number,
    timePeriod: ITimePeriodFilter,
    limit: number,
  ): Promise<{ id: number; title: string; visits: number }[]> {
    const subQb = this.catalogVisitRepository
      .createQueryBuilder('cv')
      .innerJoin('cv.catalog', 'c')
      .where('c.id_creation_business = :idBusiness', { idBusiness })
      .andWhere('c.status <> :status', { status: StatusEnum.DELETED })
      .select('cv.idCatalog', 'idCatalog')
      .addSelect('COUNT(*)', 'visits')
      .groupBy('cv.idCatalog');
    this.appendCreationDateRange(subQb, timePeriod);
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
      .getRawMany<{ id: number | string; title: string; visits: string }>();
    return rows.map((r) => ({
      id: Number(r.id),
      title: r.title,
      visits: parseInt(r.visits ?? '0', 10),
    }));
  }

  /**
   * Count catalog visits for non-deleted catalogs (admin statistics).
   * With `startDate` and `endDate`, counts rows whose `creation_date` lies in that inclusive range; otherwise counts all such visits.
   * @param {ITimePeriodFilter} [timePeriod] - Optional date bounds.
   * @returns {Promise<IAdminTimeSeriesStats>} Total visits only (`data` is never set).
   */
  async getGlobalVisitStatsForAdminStatistics(
    timePeriod?: ITimePeriodFilter,
  ): Promise<IAdminTimeSeriesStats> {
    const qb = this.createQueryBuilder('cv')
      .innerJoin('cv.catalog', 'c')
      .where('c.status <> :catalogStatus', {
        catalogStatus: StatusEnum.DELETED,
      });
    if (timePeriod?.startDate && timePeriod?.endDate) {
      qb.andWhere(
        'cv.creationDate >= :startDate AND cv.creationDate <= :endDate',
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
