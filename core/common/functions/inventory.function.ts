import type { ProductSku, StockMovement } from '../../entities';
import type { ProductSkuSchema, StockMovementSchema } from '../../schemas';

/**
 * Maps ProductSku entity to ProductSkuSchema for inventory context.
 */
export function toProductSkuSchemaFromInventory(
  sku: ProductSku,
): ProductSkuSchema {
  return {
    ...sku,
    variationOptions: sku.variationOptions ?? {},
  } as ProductSkuSchema;
}

/**
 * Maps StockMovement entity to StockMovementSchema.
 */
export function toStockMovementSchema(
  movement: StockMovement,
): StockMovementSchema {
  const schema = { ...movement } as StockMovementSchema;
  if (movement.productSku) {
    schema.productSku = toProductSkuSchemaFromInventory(
      movement.productSku,
    ) as any;
  }
  return schema;
}
