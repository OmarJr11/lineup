import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';

@InputType()
/** Input required to change a cart item's quantity. */
export class UpdateCartItemInput {
  /** Cart item identifier. @type {number} */
    /** New item quantity. @type {number} */
  @Field(() => Int)
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  cartItemId: number;

  @Field(() => Int)
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}