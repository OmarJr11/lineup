import { registerEnumType } from '@nestjs/graphql';

/**
 * Types of stock movements for inventory history tracking.
 */
export enum StockMovementTypeEnum {
  /** Stock added from a purchase (supplier). */
  PURCHASE = 'PURCHASE',
  /** Manual adjustment to increase stock. */
  ADJUSTMENT_IN = 'ADJUSTMENT_IN',
  /** Manual adjustment to decrease stock. */
  ADJUSTMENT_OUT = 'ADJUSTMENT_OUT',
  /** Stock decreased due to a sale. */
  SALE = 'SALE',
  /** SKU/variation was removed (discontinued). */
  REMOVAL = 'REMOVAL',
}

registerEnumType(StockMovementTypeEnum, { name: 'StockMovementTypeEnum' });
