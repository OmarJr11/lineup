import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Input for registering a purchase made by a customer (sale). Decreases stock.
 */
@InputType()
export class RegisterPurchaseInput {
  @Field(() => Int)
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  idProductSku: number;

  @Field(() => Int)
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
