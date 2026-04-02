/**
 * Global catalog inventory aggregates for the admin dashboard.
 */
export interface IAdminCatalogGlobalStats {
  readonly totalProducts: number;
  readonly totalSkus: number;
  readonly productsWithoutStock: number;
}
