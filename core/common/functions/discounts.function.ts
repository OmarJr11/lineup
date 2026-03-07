import { Discount, DiscountProduct, DiscountProductAudit } from '../../entities';
import {
    DiscountProductAuditSchema,
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
 * Maps DiscountProductAudit entity to DiscountProductAuditSchema.
 */
export function toDiscountProductAuditSchema(
    audit: DiscountProductAudit,
): DiscountProductAuditSchema {
    return audit as unknown as DiscountProductAuditSchema;
}
