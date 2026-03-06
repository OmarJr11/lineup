import { registerEnumType } from '@nestjs/graphql';

/**
 * Scope of discount application: business (all products), catalog (all products in catalog), or product (single product).
 */
export enum DiscountScopeEnum {
    /** Applies to all products of a business. */
    BUSINESS = 'business',
    /** Applies to all products in a catalog. */
    CATALOG = 'catalog',
    /** Applies to a single product. */
    PRODUCT = 'product',
}

registerEnumType(DiscountScopeEnum, { name: 'DiscountScopeEnum' });
