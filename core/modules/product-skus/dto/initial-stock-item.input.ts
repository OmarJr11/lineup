import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

/**
 * Input for initial stock when creating a product.
 * Same structure as AdjustStockInput but without idProductSku.
 * The array index maps to the SKU creation order (cartesian product order).
 */
@InputType()
export class InitialStockItemInput {
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
