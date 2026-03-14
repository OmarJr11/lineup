import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsEmpty, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength, Validate, ValidateNested } from 'class-validator';
import { PriceCurrencyOnlyForSimpleProductsValidator } from '../../../common/validators/price-currency-only-for-simple-products.validator';
import { ProductImageInput } from './product-image.input';
import { CreateProductVariationInput } from './create-product-variation.input';
import { PriceCurrencyInput } from './price-currency.input';

@InputType()
export class CreateProductInput {
    @Field()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(255)
    @IsString()
    title: string;

    @Field()
    @IsOptional()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(255)
    @IsString()
    subtitle: string;

    @Field()
    @IsNotEmpty()
    @IsString()
    description: string;

    /** Price for products without variations. Must be omitted when variations are provided. */
    @Field(() => PriceCurrencyInput, { nullable: true })
    @IsOptional()
    @Validate(PriceCurrencyOnlyForSimpleProductsValidator)
    @ValidateNested()
    @Type(() => PriceCurrencyInput)
    priceCurrency?: PriceCurrencyInput;

    @Field()
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    idCatalog: number;

    @Field(() => [ProductImageInput])
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductImageInput)
    images: ProductImageInput[];

    /** Variations with options (value + initialStock). Stock is applied via adjustStock to create StockMovement records. */
    @Field(() => [CreateProductVariationInput], { nullable: true })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateProductVariationInput)
    variations?: CreateProductVariationInput[];

    /** For simple products only. Stock for variations is defined in each option via initialStock. */
    @Field(() => Int, { nullable: true })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    initialQuantity?: number;

    @IsEmpty()
    hasVariations?: boolean;
}
