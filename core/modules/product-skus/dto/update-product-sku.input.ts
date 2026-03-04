import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min,
} from 'class-validator';

/**
 * Input for updating a product SKU (e.g. quantity or price).
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
    price?: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    skuCode?: string;
}
