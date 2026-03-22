import type { IAdminLabeledCount } from './admin-labeled-count.interface';

/**
 * Platform-wide discount metrics for the admin dashboard.
 */
export interface IAdminDiscountGlobalStats {
  discountsByStatus: IAdminLabeledCount[];
  discountsByType: IAdminLabeledCount[];
  readonly expiringSoonCount: number;
}
