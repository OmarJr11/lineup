import { SelectQueryBuilder } from 'typeorm';
import { TimePeriodGranularityEnum } from '../enums/time-period-granularity.enum';
import { ITimePeriodFilter } from '../interfaces/time-period-filter.interface';

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
     * Whether the time period has all fields needed for time-series grouping.
     */
    static shouldGroupByTime(timePeriod?: ITimePeriodFilter): boolean {
        return !!(
            timePeriod?.startDate &&
            timePeriod?.endDate &&
            timePeriod?.granularity
        );
    }

    /**
     * Builds SQL date filter clause for the given alias.
     */
    static buildDateFilter(alias: string, timePeriod?: ITimePeriodFilter): string {
        if (!timePeriod?.startDate || !timePeriod?.endDate) return '1=1';
        return `${alias}.creation_date >= :startDate AND ${alias}.creation_date <= :endDate`;
    }

    /**
     * Returns params for date filter.
     */
    static getDateParams(timePeriod?: ITimePeriodFilter): Record<string, string> {
        if (!timePeriod?.startDate || !timePeriod?.endDate) return {};
        return {
            startDate: timePeriod.startDate,
            endDate: timePeriod.endDate,
        };
    }

    /**
     * Applies time filter to query builder.
     */
    static applyTimeFilter(
        qb: { andWhere: (clause: string, params?: object) => unknown },
        alias: string,
        timePeriod?: ITimePeriodFilter,
    ): void {
        const clause = StatisticsQueryHelper.buildDateFilter(alias, timePeriod);
        if (clause !== '1=1') {
            qb.andWhere(clause, StatisticsQueryHelper.getDateParams(timePeriod));
        }
    }

    /**
     * Executes time-series grouped query and returns data points.
     */
    static async getTimeSeriesFromQuery(
        qb: SelectQueryBuilder<unknown>,
        alias: string,
        timePeriod: ITimePeriodFilter,
    ): Promise<ITimeSeriesDataPoint[]> {
        const granularity = timePeriod.granularity ?? TimePeriodGranularityEnum.DAY;
        const truncExpr = `DATE_TRUNC('${granularity}', ${alias}.creation_date AT TIME ZONE 'UTC')`;
        const formatExpr =
            granularity === TimePeriodGranularityEnum.DAY
                ? `TO_CHAR(${truncExpr}, 'YYYY-MM-DD')`
                : granularity === TimePeriodGranularityEnum.WEEK
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
     * Total count with optional time-series for any entity query (admin / dashboard use).
     * @param {() => SelectQueryBuilder<unknown>} buildQb - Factory returning a fresh QB with alias `alias`.
     * @param {string} alias - Root alias (must map to creation_date).
     * @param {ITimePeriodFilter} [timePeriod] - Optional range and granularity.
     * @returns {Promise<{ total: number; data?: ITimeSeriesDataPoint[] }>} Aggregated stats.
     */
    static async computeAggregatedTimeSeries(
        buildQb: () => SelectQueryBuilder<unknown>,
        alias: string,
        timePeriod?: ITimePeriodFilter,
    ): Promise<{ total: number; data?: ITimeSeriesDataPoint[] }> {
        if (!timePeriod?.startDate || !timePeriod?.endDate) {
            const total = await buildQb().getCount();
            return { total };
        }
        const filtered = buildQb();
        StatisticsQueryHelper.applyTimeFilter(filtered, alias, timePeriod);
        const total = await filtered.getCount();
        if (!StatisticsQueryHelper.shouldGroupByTime(timePeriod)) {
            return { total };
        }
        const forSeries = buildQb();
        StatisticsQueryHelper.applyTimeFilter(forSeries, alias, timePeriod);
        const data = await StatisticsQueryHelper.getTimeSeriesFromQuery(
            forSeries,
            alias,
            timePeriod,
        );
        return { total, data };
    }
}
