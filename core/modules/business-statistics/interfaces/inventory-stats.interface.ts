import { IStockMovementStatItem } from '../../stock-movements/interfaces/stock-movement-stat-item.interface';
import { ITimeSeriesStats } from './business-visits-stats.interface';

/**
 * Combined inventory/stock statistics.
 */
export interface IInventoryStats {
    skusLowOrOutOfStockCount: number;
    recentStockMovements: IStockMovementStatItem[];
    salesCount: ITimeSeriesStats;
    productsWithoutStockCount: number;
}
