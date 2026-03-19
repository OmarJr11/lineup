import { Discount, DiscountProduct, EntityAudit } from '../../entities';
import {
    EntityAuditSchema,
    DiscountProductSchema,
    DiscountSchema,
} from '../../schemas';

/**
 * Maps Discount entity to DiscountSchema.
 */
export function toDiscountSchema(discount: Discount): DiscountSchema {
    return discount as unknown as DiscountSchema;
}

/**
 * Maps DiscountProduct entity to DiscountProductSchema.
 */
export function toDiscountProductSchema(discountProduct: DiscountProduct): DiscountProductSchema {
    return discountProduct as unknown as DiscountProductSchema;
}

/**
 * Maps EntityAudit entity to EntityAuditSchema.
 */
export function toEntityAuditSchema(audit: EntityAudit): EntityAuditSchema {
    return audit as unknown as EntityAuditSchema;
}
