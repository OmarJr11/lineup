import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Validate } from 'class-validator';
import { PriceCurrencyPairValidator } from '../../../common/validators/price-currency-pair.validator';

/**
 * Optional price and currency pair for product SKUs.
 * Both must be provided together or both omitted.
 */
@InputType()
export class PriceCurrencyInput {
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
