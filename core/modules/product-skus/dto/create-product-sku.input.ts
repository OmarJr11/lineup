import { Type } from 'class-transformer';
import {
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    MaxLength,
    Min,
} from 'class-validator';

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
    @IsObject()
    variationOptions: Record<string, string>;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    quantity?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    price?: number;
}
