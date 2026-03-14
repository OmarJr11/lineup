import { Field, InputType } from '@nestjs/graphql';
import {
    IsArray,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductVariationOptionInput } from './product-variation-option.input';
import { VariationOptionPriceInput } from './variation-option-price.input';

/**
 * Input for creating a product variation (used in CreateProductInput).
 * Only includes fields needed for creation; id and idProduct are set internally.
 */
@InputType()
export class CreateProductVariationInput {
    @Field()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(255)
    @IsString()
    title: string;

    @Field(() => [ProductVariationOptionInput])
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductVariationOptionInput)
    options: ProductVariationOptionInput[];

    /** Price per option. Assigns the corresponding price to each SKU. */
    @Field(() => [VariationOptionPriceInput], { nullable: true })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VariationOptionPriceInput)
    optionPrices?: VariationOptionPriceInput[];
}
