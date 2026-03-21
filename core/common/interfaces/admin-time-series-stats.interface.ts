import type { IAdminTimeSeriesDataPoint } from './admin-time-series-data-point.interface';

/**
 * Total count with optional time-series breakdown for admin dashboards.
 */
export interface IAdminTimeSeriesStats {
  readonly total: number;
  data?: IAdminTimeSeriesDataPoint[];
}
