import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { StockMovementTypeEnum } from '../../../common/enums';

/**
 * Input for creating a stock movement record.
 */
@InputType()
export class CreateStockMovementInput {
  @Field(() => Int)
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  idProductSku: number;

  @Field(() => String)
  @IsNotEmpty()
  @IsEnum(StockMovementTypeEnum)
  type: StockMovementTypeEnum;

  @Field(() => Int)
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  quantityDelta: number;

  @Field(() => Int)
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  previousQuantity: number;

  @Field(() => Int)
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  newQuantity: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  price?: number;
}
