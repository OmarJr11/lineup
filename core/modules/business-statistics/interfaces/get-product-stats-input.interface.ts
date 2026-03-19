import { TimePeriodInput } from '../dto/time-period.input';

/**
 * Input for getProductStats query.
 */
export interface IGetProductStatsInput {
    idBusiness: number;
    timePeriod?: TimePeriodInput;
    limit?: number;
}
