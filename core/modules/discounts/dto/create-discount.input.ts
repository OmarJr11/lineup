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
import { DiscountScopeEnum, DiscountTypeEnum } from '../../../common/enums';

/**
 * Input for creating a discount.
 * Scope business: idCreationBusiness (from request) is the business it applies to.
 * Scope catalog: idCatalog is required.
 * Scope product: idProduct is required.
 */
@InputType()
export class CreateDiscountInput {
  @Field(() => DiscountScopeEnum)
  @IsNotEmpty()
  @IsEnum(DiscountScopeEnum)
  scope: DiscountScopeEnum;

  @Field(() => Int, { nullable: true })
  @ValidateIf((o) => o.scope === DiscountScopeEnum.CATALOG)
  @IsNotEmpty({ message: 'idCatalog is required when scope is CATALOG' })
  @Type(() => Number)
  @IsInt()
  idCatalog?: number;

  @Field(() => Int, { nullable: true })
  @ValidateIf((o) => o.scope === DiscountScopeEnum.PRODUCT)
  @IsNotEmpty({ message: 'idProduct is required when scope is PRODUCT' })
  @Type(() => Number)
  @IsInt()
  idProduct?: number;

  @Field(() => DiscountTypeEnum)
  @IsNotEmpty()
  @IsEnum(DiscountTypeEnum)
  discountType: DiscountTypeEnum;

  @Field(() => Float)
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value: number;

  @Field(() => Int, { nullable: true })
  @ValidateIf((o) => o.discountType === DiscountTypeEnum.FIXED)
  @IsNotEmpty({ message: 'idCurrency is required when discountType is FIXED' })
  @Type(() => Number)
  @IsInt()
  idCurrency?: number;

  @Field()
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Field()
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  endDate: Date;
}
