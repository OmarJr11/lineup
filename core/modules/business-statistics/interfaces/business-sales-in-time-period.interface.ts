import type { StockMovement } from '../../../entities';
import type { ITimeSeriesStats } from './business-visits-stats.interface';

/**
 * Sales list and aggregate count for a dashboard time period.
 */
export interface IBusinessSalesInTimePeriod {
  sales: StockMovement[];
  salesCount: ITimeSeriesStats;
}
