import type { IStockMovementStatItem } from '../../../common/interfaces';

/**
 * Combined inventory/stock statistics.
 */
export interface IInventoryStats {
  skusLowOrOutOfStockCount: number;
  recentStockMovements: IStockMovementStatItem[];
  productsWithoutStockCount: number;
}
