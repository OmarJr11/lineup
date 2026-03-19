import { registerEnumType } from '@nestjs/graphql';

/**
 * Granularity for grouping time-series statistics.
 * Used for line charts and frequency polygons over time.
 */
export enum TimePeriodGranularityEnum {
    /** Group by day (e.g. 2025-03-18). */
    DAY = 'day',
    /** Group by week (e.g. 2025-W12). */
    WEEK = 'week',
    /** Group by month (e.g. 2025-03). */
    MONTH = 'month',
}

registerEnumType(TimePeriodGranularityEnum, {
    name: 'TimePeriodGranularityEnum',
});
