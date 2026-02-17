import { VisitTypeEnum } from '../../../common/enums';

/**
 * Input for recording a visit to a business, product, or catalog.
 */
export interface IRecordVisitInput {
    /** Type of entity being visited */
    type: VisitTypeEnum;
    /** ID of the business, product, or catalog */
    id: number;
}
