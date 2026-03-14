import { Field, InputType, Int } from '@nestjs/graphql';
import { IsArray, IsEmpty, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength, Validate, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PriceCurrencyOnlyForSimpleProductsValidator } from '../../../common/validators/price-currency-only-for-simple-products.validator';
import { ProductImageInput } from './product-image.input';
import { ProductVariationInput } from './product-variation.input';
import { PriceCurrencyInput } from './price-currency.input';

@InputType()
export class UpdateProductInput {
  @Field()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  id: number;

  @Field()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  @IsString()
  title?: string;

  @Field()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  @IsString()
  subtitle?: string;

  @Field()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  description?: string;

  /** Price for products without variations. Must be omitted when variations are provided. */
  @Field(() => PriceCurrencyInput, { nullable: true })
  @IsOptional()
  @Validate(PriceCurrencyOnlyForSimpleProductsValidator)
  @ValidateNested()
  @Type(() => PriceCurrencyInput)
  priceCurrency?: PriceCurrencyInput;

  @Field()
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  idCatalog?: number;

  @Field(() => [ProductImageInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInput)
  images?: ProductImageInput[];

  @Field(() => [ProductVariationInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariationInput)
  variations?: ProductVariationInput[];

  /** For simple products only. Stock for variations is defined in each option via initialStock. */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  initialQuantity?: number;

  @IsEmpty()
  hasVariations?: boolean;
}
