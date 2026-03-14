import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/**
 * Single option within a variation (e.g. "Rojo" with initial stock 10).
 */
@InputType()
export class ProductVariationOptionInput {
    @Field()
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    value: string;

    /** Initial stock for this option. Used when building SKUs (first variation's stock applies per combination). */
    @Field(() => Int, { nullable: true })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    initialStock?: number;
}
