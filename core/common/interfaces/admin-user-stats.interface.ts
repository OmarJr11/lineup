import type { IAdminStatusCount } from './admin-status-count.interface';
import type { IAdminTimeSeriesStats } from './admin-time-series-stats.interface';

/**
 * Platform-wide user metrics for the admin dashboard.
 */
export interface IAdminUserStats {
  readonly totalUsers: number;
  usersByStatus: IAdminStatusCount[];
  newUsersInPeriod?: IAdminTimeSeriesStats;
}
