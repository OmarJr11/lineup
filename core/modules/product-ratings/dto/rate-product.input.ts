import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/** Minimum allowed star value. */
const STARS_MIN = 1;

/** Maximum allowed star value. */
const STARS_MAX = 5;

/**
 * Input DTO for rating a product with a star score and an optional comment.
 */
@InputType()
export class RateProductInput {
    @Field(() => Int)
    @IsInt()
    idProduct: number;

    /** Star rating from 1 to 5 (inclusive). */
    @Field(() => Int)
    @IsInt()
    @Min(STARS_MIN)
    @Max(STARS_MAX)
    stars: number;

    /** Optional written comment accompanying the rating. */
    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    comment?: string;
}
