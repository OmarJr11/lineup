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
  /** Current ISO week Mon–Sun (e.g. 2025-W12). */
  THIS_WEEK = 'this_week',
  /** Current calendar month (e.g. 2025-03). */
  THIS_MONTH = 'this_month',
  /** Current calendar year (e.g. 2025). */
  THIS_YEAR = 'this_year',
  /** Range*/
  RANGE = 'range',
  ALL = 'all',
}

registerEnumType(TimePeriodGranularityEnum, {
  name: 'TimePeriodGranularityEnum',
});
