/**
 * Single point in an admin statistics time-series.
 */
export interface IAdminTimeSeriesDataPoint {
    readonly period: string;
    readonly value: number;
}
