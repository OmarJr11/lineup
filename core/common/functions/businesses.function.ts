import { Business } from '../../entities';
import { BusinessSchema } from '../../schemas';


export function toBusinessSchema(business: Business): BusinessSchema {
    return business as BusinessSchema;
}