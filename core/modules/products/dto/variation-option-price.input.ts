import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

/**
 * Price for a single option within a variation (e.g. Color "Red" = $10).
 * Used when product has variations to assign price per SKU based on the option.
 */
@InputType()
export class VariationOptionPriceInput {
    @Field()
    @IsNotEmpty()
    @IsString()
    option: string;

    @Field()
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    price: number;

    @Field()
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    idCurrency: number;
}
