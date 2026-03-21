import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { VariationOptionItemInput } from './variation-option-item.input';

/**
 * Input for initial stock when creating a product.
 * For simple products: omit variationOptions.
 * For products with variations: variationOptions identifies the SKU.
 */
@InputType()
export class InitialStockItemInput {
  /** Identifies the SKU by its variation options. Required for products with variations. Omit for simple products. */
  @Field(() => [VariationOptionItemInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariationOptionItemInput)
  variationOptions?: VariationOptionItemInput[];

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
