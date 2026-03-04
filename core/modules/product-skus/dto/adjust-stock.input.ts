import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min,
} from 'class-validator';

/**
 * Input for adjusting stock (add or subtract quantity).
 * quantityDelta: positive to add, negative to subtract.
 */
@InputType()
export class AdjustStockInput {
    @Field(() => Int)
    @IsNotEmpty()
    @Type(() => Number)
    @IsInt()
    idProductSku: number;

    @Field(() => Int)
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    quantityDelta: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;
}
