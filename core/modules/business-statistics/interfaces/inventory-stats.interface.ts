import type { IStockMovementStatItem } from '../../stock-movements/interfaces/stock-movement-stat-item.interface';
import type { ITimeSeriesStats } from './business-visits-stats.interface';

/**
 * Combined inventory/stock statistics.
 */
export interface IInventoryStats {
  skusLowOrOutOfStockCount: number;
  recentStockMovements: IStockMovementStatItem[];
  salesCount: ITimeSeriesStats;
  productsWithoutStockCount: number;
}
