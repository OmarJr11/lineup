import type { IAdminTimeSeriesStats } from './admin-time-series-stats.interface';

/**
 * Aggregated visit metrics across the platform (admin scope).
 */
export interface IAdminPlatformEngagementStats {
  readonly businessVisits: IAdminTimeSeriesStats;
  readonly productVisits: IAdminTimeSeriesStats;
  readonly catalogVisits: IAdminTimeSeriesStats;
}
