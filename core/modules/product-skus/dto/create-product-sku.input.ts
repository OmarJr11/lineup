import { Type } from 'class-transformer';
import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';
import { VariationOptionItemInput } from './variation-option-item.input';

/**
 * DTO for creating a product SKU.
 * Used when creating SKUs during product creation/update.
 */
export class CreateProductSkuInput {
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    idProduct: number;

    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    skuCode: string;

    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VariationOptionItemInput)
    variationOptions: VariationOptionItemInput[];

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    quantity?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    price?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    idCurrency?: number;
}
