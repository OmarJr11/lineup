import { Business, BusinessFollower } from '../../entities';
import { BusinessSchema, BusinessFollowerSchema } from '../../schemas';

export function toBusinessSchema(business: Business): BusinessSchema {
    return business as BusinessSchema;
}

export function toBusinessFollowerSchema(businessFollower: BusinessFollower): BusinessFollowerSchema {
    return businessFollower as BusinessFollowerSchema;
}