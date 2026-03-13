import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Optional filters for product search.
 * Applied when target is PRODUCTS or ALL.
 */
@InputType()
export class ProductSearchFiltersInput {
    @Field(() => Float, { nullable: true, description: 'Minimum price (inclusive)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @Field(() => Float, { nullable: true, description: 'Maximum price (inclusive)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @Field({ nullable: true, description: 'Location text to filter (ILIKE match)' })
    @IsOptional()
    @IsString()
    location?: string;

    @Field(() => Float, { nullable: true, description: 'Minimum rating (0.00–5.00, inclusive)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(5)
    minRating?: number;
}
