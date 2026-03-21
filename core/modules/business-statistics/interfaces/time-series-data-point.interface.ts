/**
 * Single data point for time-series charts (line charts, frequency polygons).
 * period: x-axis label (e.g. "2025-03-18", "2025-W12", "2025-03").
 * value: y-axis value (count or aggregate).
 */
export interface ITimeSeriesDataPoint {
    period: string;
    value: number;
}
