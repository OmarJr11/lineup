/**
 * Count of entities grouped by status (e.g. users or businesses).
 */
export interface IAdminStatusCount {
  readonly status: string;
  readonly count: number;
}
