import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

@InputType()
/** Input required to remove an item from a cart. */
export class RemoveCartItemInput {
  /** Cart item identifier. @type {number} */
  @Field(() => Int)
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  cartItemId: number;
}