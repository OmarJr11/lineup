import type { IFrequencyDataPoint } from './frequency-data-point.interface';
import type { IStatItemWithVisits } from './stat-item-with-visits.interface';
import type { ITimeSeriesStats } from './business-visits-stats.interface';

/**
 * Combined catalog statistics.
 */
export interface ICatalogStats {
  topByVisits: IStatItemWithVisits[];
  productsPerCatalog: IFrequencyDataPoint[];
  catalogVisitsOverTime: ITimeSeriesStats;
}
