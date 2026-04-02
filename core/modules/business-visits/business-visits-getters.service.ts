import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BasicService } from '../../common/services';
import {
  IAdminTimeSeriesStats,
  ITimePeriodFilter,
} from '../../common/interfaces';
import { BusinessVisit } from '../../entities';

/** Raw SQL column for visit timestamp (alias `bv`). */
const BV_CREATION = '"bv"."creation_date"';

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
   * Inclusive local-calendar bounds (server TZ) for ISO start/end.
   * @param {string} startIso - Range start.
   * @param {string} endIso - Range end.
   * @returns {{ start: Date; end: Date }} Bounds as Date for the driver.
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
   * Appends `creation_date` range when both bounds exist.
   * @param {SelectQueryBuilder<BusinessVisit>} qb - Builder with alias `bv`.
   * @param {ITimePeriodFilter} [timePeriod] - Optional filter.
   */
  private appendCreationDateRange(
    qb: SelectQueryBuilder<BusinessVisit>,
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
      `${BV_CREATION} >= :bvRangeStart AND ${BV_CREATION} <= :bvRangeEnd`,
      { bvRangeStart: start, bvRangeEnd: end },
    );
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
    const qb = this.createQueryBuilder('bv').where(
      'bv.id_business = :idBusiness',
      { idBusiness },
    );
    this.appendCreationDateRange(qb, timePeriod);
    return await qb.getCount();
  }

  /**
   * Get visit counts by auth type (anonymous vs identified).
   * @param {number} idBusiness - The business ID.
   * @param {string} startDate - Range start ISO.
   * @param {string} endDate - Range end ISO.
   * @returns {Promise<{ anonymous: number; identified: number }>} Counts.
   */
  async getCountByAuthType(
    idBusiness: number,
    startDate: string,
    endDate: string,
  ): Promise<{ anonymous: number; identified: number }> {
    const baseWhere = 'bv.id_business = :idBusiness';
    const withDate = (qb: SelectQueryBuilder<BusinessVisit>) => {
      if (startDate && endDate) {
        const { start, end } = this.boundsToLocalCalendarInclusive(
          startDate,
          endDate,
        );
        return qb.andWhere(
          `${BV_CREATION} >= :bvRangeStart AND ${BV_CREATION} <= :bvRangeEnd`,
          { bvRangeStart: start, bvRangeEnd: end },
        );
      }
      return qb;
    };
    const [anonymous, identified] = await Promise.all([
      withDate(
        this.createQueryBuilder('bv')
          .where(baseWhere, { idBusiness })
          .andWhere('bv.idCreationUser IS NULL'),
      ).getCount(),
      withDate(
        this.createQueryBuilder('bv')
          .where(baseWhere, { idBusiness })
          .andWhere('bv.idCreationUser IS NOT NULL'),
      ).getCount(),
    ]);
    return { anonymous, identified };
  }

  /**
   * Count visits for one business in `[startDate, endDate]` (local calendar inclusive).
   * @param {number} idBusiness - Business ID.
   * @param {string} startDate - Start ISO.
   * @param {string} endDate - End ISO.
   * @returns {Promise<number>} Count.
   */
  async getTimeSeriesByBusiness(
    idBusiness: number,
    startDate: string,
    endDate: string,
  ): Promise<number> {
    const { start, end } = this.boundsToLocalCalendarInclusive(
      startDate,
      endDate,
    );
    return this.createQueryBuilder('bv')
      .where('bv.id_business = :idBusiness', { idBusiness })
      .andWhere(
        `${BV_CREATION} >= :bvRangeStart AND ${BV_CREATION} <= :bvRangeEnd`,
        { bvRangeStart: start, bvRangeEnd: end },
      )
      .getCount();
  }

  /**
   * Base QB for one business, optional `creation_date` range.
   * @param {number} idBusiness - Business ID.
   * @param {ITimePeriodFilter} [timePeriod] - Optional filter.
   * @returns {SelectQueryBuilder<BusinessVisit>} Builder.
   */
  createBaseQueryBuilder(
    idBusiness: number,
    timePeriod?: ITimePeriodFilter,
  ): SelectQueryBuilder<BusinessVisit> {
    const qb = this.createQueryBuilder('bv').where(
      'bv.id_business = :idBusiness',
      { idBusiness },
    );
    this.appendCreationDateRange(qb, timePeriod);
    return qb;
  }

  /**
   * All platform visits (admin), optional range on `creation_date`.
   * @param {ITimePeriodFilter} [timePeriod] - Optional bounds.
   * @returns {Promise<IAdminTimeSeriesStats>} Total count.
   */
  async getGlobalVisitStatsForAdminStatistics(
    timePeriod?: ITimePeriodFilter,
  ): Promise<IAdminTimeSeriesStats> {
    const qb = this.createQueryBuilder('bv');
    if (timePeriod?.startDate && timePeriod?.endDate) {
      const { start, end } = this.boundsToLocalCalendarInclusive(
        timePeriod.startDate,
        timePeriod.endDate,
      );
      qb.andWhere(
        `${BV_CREATION} >= :bvRangeStart AND ${BV_CREATION} <= :bvRangeEnd`,
        { bvRangeStart: start, bvRangeEnd: end },
      );
    }
    const total = await qb.getCount();
    return { total };
  }
}
