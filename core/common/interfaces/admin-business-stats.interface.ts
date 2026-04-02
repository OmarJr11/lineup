import type { IAdminStatusCount } from './admin-status-count.interface';
import type { IAdminTimeSeriesStats } from './admin-time-series-stats.interface';

/**
 * Platform-wide business metrics for the admin dashboard.
 */
export interface IAdminBusinessStats {
  readonly totalBusinesses: number;
  readonly onlineBusinessesCount: number;
  businessesByStatus: IAdminStatusCount[];
  newBusinessesInPeriod?: IAdminTimeSeriesStats;
}
