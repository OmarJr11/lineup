import { Field, InputType } from '@nestjs/graphql';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductVariationOptionInput } from './create-product-variation-option.input';

/**
 * Input for creating a product variation (used in CreateProductInput).
 * Only includes fields needed for creation; id and idProduct are set internally.
 * Price and stock are set via update, not on create.
 * Stock is not applied on create; use update to set initial stock per option.
 */
@InputType()
export class CreateProductVariationInput {
  @Field()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  @IsString()
  title: string;

  @Field(() => [CreateProductVariationOptionInput])
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariationOptionInput)
  options: CreateProductVariationOptionInput[];
}
