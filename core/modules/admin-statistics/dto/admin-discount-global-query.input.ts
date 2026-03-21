import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Default horizon in days for "expiring soon" discount counts. */
export const ADMIN_DISCOUNT_EXPIRING_DEFAULT_DAYS = 7;

/** Maximum allowed horizon for expiring-soon discount stats. */
const ADMIN_DISCOUNT_EXPIRING_MAX_DAYS = 365;

/**
 * Optional filters for admin discount global statistics.
 */
@InputType()
export class AdminDiscountGlobalQueryInput {
    @Field(() => Int, {
        nullable: true,
        description: 'Days ahead to count discounts ending within that window',
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(ADMIN_DISCOUNT_EXPIRING_MAX_DAYS)
    days?: number;
}
