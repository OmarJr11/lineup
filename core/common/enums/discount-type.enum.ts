import { registerEnumType } from '@nestjs/graphql';

/**
 * Type of discount: percentage off or fixed amount in currency.
 */
export enum DiscountTypeEnum {
    /** Discount as percentage (e.g. 10 = 10% off). */
    PERCENTAGE = 'percentage',
    /** Discount as fixed amount in a specific currency (e.g. 12 = 12 units of currency). */
    FIXED = 'fixed',
}

registerEnumType(DiscountTypeEnum, { name: 'DiscountTypeEnum' });
