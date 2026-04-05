import type { SelectQueryBuilder } from 'typeorm';
import { TimePeriodGranularityEnum } from '../enums/time-period-granularity.enum';
import type { ITimePeriodFilter } from '../interfaces/time-period-filter.interface';
import { NotAcceptableException } from '@nestjs/common';

/**
 * Data point for time-series charts.
 */
export interface ITimeSeriesDataPoint {
  period: string;
  value: number;
}

/**
 * Helper for statistics queries with time period filtering and grouping.
 */
export class StatisticsQueryHelper {
  /**
   * True when range and granularity are all set (time-series queries).
   */
  static shouldGroupByTime(timePeriod?: ITimePeriodFilter): boolean {
    return !!(
      timePeriod?.startDate &&
      timePeriod?.endDate &&
      timePeriod?.granularity
    );
  }

  /**
   * Predicate on `creationDate` with named params `:startDate`, `:endDate`.
   */
  static buildDateFilter(alias: string): string {
    return `${alias}.creationDate >= :startDate AND ${alias}.creationDate <= :endDate`;
  }

  /**
   * Adds date-range filter when both bounds exist.
   */
  static applyTimeFilter(
    qb: { andWhere: (clause: string, params?: object) => unknown },
    alias: string,
    timePeriod?: ITimePeriodFilter,
  ): void {
    if (!timePeriod?.startDate || !timePeriod?.endDate) {
      return;
    }
    qb.andWhere(StatisticsQueryHelper.buildDateFilter(alias), {
      startDate: timePeriod.startDate,
      endDate: timePeriod.endDate,
    });
  }

  /**
   * PostgreSQL `DATE_TRUNC` unit for time-series (month for this year, otherwise day).
   */
  static getPostgresTruncUnitForTimeSeries(
    granularity?: TimePeriodGranularityEnum,
  ): 'day' | 'week' | 'month' {
    if (granularity === TimePeriodGranularityEnum.THIS_YEAR) {
      return 'month';
    }
    return 'day';
  }

  /**
   * Grouped counts by calendar bucket on `creation_date` (UTC).
   */
  static async getTimeSeriesFromQuery(
    qb: SelectQueryBuilder<unknown>,
    alias: string,
    timePeriod: ITimePeriodFilter,
  ): Promise<ITimeSeriesDataPoint[]> {
    const truncUnit = StatisticsQueryHelper.getPostgresTruncUnitForTimeSeries(
      timePeriod.granularity,
    );
    const truncExpr = `DATE_TRUNC('${truncUnit}', ${alias}.creation_date AT TIME ZONE 'UTC')`;
    const formatExpr =
      truncUnit === 'day'
        ? `TO_CHAR(${truncExpr}, 'YYYY-MM-DD')`
        : truncUnit === 'week'
          ? `TO_CHAR(${truncExpr}, 'IYYY-"W"IW')`
          : `TO_CHAR(${truncExpr}, 'YYYY-MM')`;
    const rawQb = qb
      .select(formatExpr, 'period')
      .addSelect('COUNT(*)', 'value')
      .groupBy(formatExpr)
      .orderBy(formatExpr, 'ASC');
    const rows = await rawQb.getRawMany<{ period: string; value: string }>();
    return rows.map((r) => ({
      period: r.period,
      value: parseInt(r.value ?? '0', 10),
    }));
  }

  /**
   * Inclusive bounds for dashboard presets using the **server local** calendar
   * (Node `TZ`), so “today” aligns with that zone—not only the UTC calendar day.
   * @param {TimePeriodGranularityEnum} timePeriod - Preset (not RANGE).
   * @returns {{ startDate: string; endDate: string }} Bounds as ISO strings.
   */
  static calculateTimePeriodRange(timePeriod: TimePeriodGranularityEnum): {
    startDate: string;
    endDate: string;
  } {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    let start: Date;
    let end: Date;
    switch (timePeriod) {
      case TimePeriodGranularityEnum.TODAY: {
        start = new Date(y, m, d, 0, 0, 0, 0);
        end = new Date(y, m, d, 23, 59, 59, 999);
        break;
      }
      case TimePeriodGranularityEnum.YESTERDAY: {
        const prev = new Date(y, m, d - 1);
        const py = prev.getFullYear();
        const pm = prev.getMonth();
        const pd = prev.getDate();
        start = new Date(py, pm, pd, 0, 0, 0, 0);
        end = new Date(py, pm, pd, 23, 59, 59, 999);
        break;
      }
      case TimePeriodGranularityEnum.THIS_WEEK: {
        const thisWeek = StatisticsQueryHelper.getThisWeek(now);
        start = thisWeek.start;
        end = thisWeek.end;
        break;
      }
      case TimePeriodGranularityEnum.THIS_MONTH: {
        const thisMonth = StatisticsQueryHelper.getThisMonth(now);
        start = thisMonth.start;
        end = thisMonth.end;
        break;
      }
      case TimePeriodGranularityEnum.THIS_YEAR: {
        const thisYear = StatisticsQueryHelper.getThisYear(now);
        start = thisYear.start;
        end = thisYear.end;
        break;
      }
      case TimePeriodGranularityEnum.ALL: {
        start = new Date(0);
        end = new Date(y, m, d, 23, 59, 59, 999);
        break;
      }
      default:
        throw new NotAcceptableException();
    }
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }

  /**
   * Current ISO week Mon–Sun in the **local** calendar of `date`.
   * @param {Date} date - Reference instant.
   * @returns {{ start: Date; end: Date }} Local start of Monday to end of Sunday.
   */
  static getThisWeek(date: Date): { start: Date; end: Date } {
    const day = date.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const thisMonday = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + mondayOffset,
      0,
      0,
      0,
      0,
    );
    const thisSunday = new Date(thisMonday);
    thisSunday.setDate(thisMonday.getDate() + 6);
    thisSunday.setHours(23, 59, 59, 999);
    return { start: thisMonday, end: thisSunday };
  }

  /**
   * Current calendar month in local time (1st 00:00 through last day 23:59:59.999).
   * @param {Date} date - Reference instant.
   * @returns {{ start: Date; end: Date }} Month bounds.
   */
  static getThisMonth(date: Date): { start: Date; end: Date } {
    const y = date.getFullYear();
    const m = date.getMonth();
    return {
      start: new Date(y, m, 1, 0, 0, 0, 0),
      end: new Date(y, m + 1, 0, 23, 59, 59, 999),
    };
  }

  /**
   * Current calendar year in local time.
   * @param {Date} date - Reference instant.
   * @returns {{ start: Date; end: Date }} 1 Jan through 31 Dec local.
   */
  static getThisYear(date: Date): { start: Date; end: Date } {
    const year = date.getFullYear();
    return {
      start: new Date(year, 0, 1, 0, 0, 0, 0),
      end: new Date(year, 11, 31, 23, 59, 59, 999),
    };
  }
}
