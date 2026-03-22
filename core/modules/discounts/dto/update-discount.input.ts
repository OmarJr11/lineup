import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  ValidateIf,
} from 'class-validator';
import { DiscountTypeEnum } from '../../../common/enums';

/**
 * Input for updating a discount.
 */
@InputType()
export class UpdateDiscountInput {
  @Field(() => Int)
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  id: number;

  @Field(() => DiscountTypeEnum, { nullable: true })
  @IsOptional()
  @IsEnum(DiscountTypeEnum)
  discountType?: DiscountTypeEnum;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value?: number;

  @Field(() => Int, { nullable: true })
  @ValidateIf((o) => o.discountType === DiscountTypeEnum.FIXED)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idCurrency?: number;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}
