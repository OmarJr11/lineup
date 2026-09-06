import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

@InputType()
/** Input required to retrieve a user's cart for one business. */
export class GetCartByBusinessInput {
  /** Business identifier. @type {number} */
  @Field(() => Int)
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  businessId: number;
}