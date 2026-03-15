import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    Min,
    Validate,
} from 'class-validator';
import { PriceCurrencyPairValidator } from '../../../common/validators/price-currency-pair.validator';

/**
 * Input for updating a single SKU (price, currency, quantity).
 * price and idCurrency must both be provided or both omitted.
 */
@InputType()
export class UpdateProductSkuItemInput {
    @Field(() => Int)
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
}
