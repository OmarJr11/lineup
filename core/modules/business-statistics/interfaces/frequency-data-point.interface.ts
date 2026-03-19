/**
 * Single data point for frequency/category charts (histograms, bar charts).
 * label: category name (e.g. "active", "percentage").
 * count: number of items in that category.
 */
export interface IFrequencyDataPoint {
    label: string;
    count: number;
}
