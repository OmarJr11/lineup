import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

@InputType()
/** Input required to add a product or SKU to a cart. */
export class AddToCartInput {
  /** Business identifier. @type {number} */
  @Field(() => Int)
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  businessId: number;

  /** Product identifier. @type {number} */
  @Field(() => Int)
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  productId: number;

  /** Optional SKU identifier. @type {number | undefined} */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  productSkuId?: number;

  /** Number of units to add. @type {number} */
  @Field(() => Int)
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  /** Optional product variation values. @type {Record<string, string> | undefined} */
  @Field(() => String, { nullable: true })
  @IsOptional()
  variationOptions?: Record<string, string>;
}
