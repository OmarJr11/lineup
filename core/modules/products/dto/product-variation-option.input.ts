import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Single option within a variation for update (e.g. "Rojo").
 * Price and quantity are not updated via product update.
 */
@InputType()
export class ProductVariationOptionInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  value: string;
}
