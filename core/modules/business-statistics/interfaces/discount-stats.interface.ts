import type { IFrequencyDataPoint } from './frequency-data-point.interface';
import type { ITimeSeriesStats } from './business-visits-stats.interface';

/**
 * Combined discount statistics.
 */
export interface IDiscountStats {
  byStatus: IFrequencyDataPoint[];
  byType: IFrequencyDataPoint[];
  expiringSoon: ITimeSeriesStats;
}
