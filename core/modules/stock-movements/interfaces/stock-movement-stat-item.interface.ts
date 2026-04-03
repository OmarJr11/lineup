import type { StockMovementTypeEnum } from '../../../common/enums';

/**
 * Stock movement item for statistics (simplified view).
 */
export interface IStockMovementStatItem {
  id: number;
  type: StockMovementTypeEnum;
  quantityDelta: number;
  creationDate: Date;
  price?: number;
}
