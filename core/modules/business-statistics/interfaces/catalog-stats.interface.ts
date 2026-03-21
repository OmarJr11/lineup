import { IFrequencyDataPoint } from './frequency-data-point.interface';
import { IStatItemWithVisits } from './stat-item-with-visits.interface';
import { ITimeSeriesStats } from './business-visits-stats.interface';

/**
 * Combined catalog statistics.
 */
export interface ICatalogStats {
    topByVisits: IStatItemWithVisits[];
    productsPerCatalog: IFrequencyDataPoint[];
    catalogVisitsOverTime: ITimeSeriesStats;
}
