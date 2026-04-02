import { registerEnumType } from '@nestjs/graphql';

/**
 * Granularity for grouping time-series statistics.
 * Used for line charts and frequency polygons over time.
 */
export enum TimePeriodGranularityEnum {
  /** Group by day (e.g. 2025-03-18). */
  TODAY = 'today',
  /** Group by yesterday (e.g. 2025-03-17). */
  YESTERDAY = 'yesterday',
  /** Group by week (e.g. 2025-W12). */
  LAST_WEEK = 'last_week',
  /** Group by month (e.g. 2025-03). */
  LAST_MONTH = 'last_month',
  /** Group by year (e.g. 2025). */
  LAST_YEAR = 'last_year',
  /** Range*/
  RANGE = 'range',
  ALL = 'all',
}

registerEnumType(TimePeriodGranularityEnum, {
  name: 'TimePeriodGranularityEnum',
});
