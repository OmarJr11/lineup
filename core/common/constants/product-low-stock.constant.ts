/**
 * Inclusive bounds for SKU quantity considered "low stock" for business alerts.
 */
export const productLowStockThresholds = {
  minQuantity: 0,
  maxQuantity: 5,
} as const;
