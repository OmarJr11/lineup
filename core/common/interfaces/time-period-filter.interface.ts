import { TimePeriodGranularityEnum } from '../enums/time-period-granularity.enum';

/**
 * Filter for statistics by time period.
 * Used by getters services for statistics queries.
 */
export interface ITimePeriodFilter {
    startDate?: string;
    endDate?: string;
    granularity?: TimePeriodGranularityEnum;
}
