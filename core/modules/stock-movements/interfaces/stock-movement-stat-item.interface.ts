/**
 * Stock movement item for statistics (simplified view).
 */
export interface IStockMovementStatItem {
  id: number;
  type: string;
  quantityDelta: number;
  creationDate: Date;
}
