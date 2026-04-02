/**
 * Discount queue job types.
 */
export enum DiscountsConsumerEnum {
  /** Record a discount-product audit entry. */
  RecordAudit = 'RecordAudit',
  /** Activate a PENDING discount (cron-triggered). */
  ActivateDiscount = 'ActivateDiscount',
  /** Remove (soft delete) expired ACTIVE discounts (cron-triggered). */
  RemoveExpiredDiscount = 'RemoveExpiredDiscount',
}
