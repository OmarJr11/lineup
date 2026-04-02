/**
 * Time-series stats: total count and optional data points for charts.
 */
export interface ITimeSeriesStats {
  total: number;
}

/**
 * Visits split by anonymous vs identified users.
 */
export interface IVisitsByAuthType {
  anonymous: number;
  identified: number;
}

/**
 * Combined business visits statistics.
 */
export interface IBusinessVisitsStats {
  visits: ITimeSeriesStats;
  visitsByAuthType: IVisitsByAuthType;
}

/**
 * Combined engagement stats: visits and new followers.
 */
export interface IEngagementStats {
  visits: IBusinessVisitsStats;
  newFollowers: ITimeSeriesStats;
}
