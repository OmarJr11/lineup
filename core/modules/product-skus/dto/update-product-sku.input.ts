import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Validate,
} from 'class-validator';
import { PriceCurrencyPairValidator } from '../../../common/validators/price-currency-pair.validator';

/**
 * Input for updating a product SKU (price, currency, quantity).
 * price and idCurrency must both be provided or both omitted.
 */
@InputType()
export class UpdateProductSkuInput {
  @Field()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  id: number;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity?: number;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Validate(PriceCurrencyPairValidator)
  price?: number;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Validate(PriceCurrencyPairValidator)
  idCurrency?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  skuCode?: string;
}
