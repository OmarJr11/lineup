import { IFrequencyDataPoint } from './frequency-data-point.interface';

/**
 * Combined discount statistics.
 */
export interface IDiscountStats {
    byStatus: IFrequencyDataPoint[];
    byType: IFrequencyDataPoint[];
    expiringSoonCount: number;
}
