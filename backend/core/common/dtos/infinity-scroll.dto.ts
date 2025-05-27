import { Type } from 'class-transformer';
import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Validate,
} from 'class-validator';
import { OrderEnum } from '../enum';
import { ValidateOrder } from '../decorators';

export class InfinityScrollDto {
    @IsNotEmpty()
    @Type(() => Number)
    @IsInt()
    page: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    limit?: number;

    @IsOptional()
    @IsEnum(() => OrderEnum)
    @Validate(ValidateOrder)
    order?: OrderEnum;

    @IsOptional()
    @IsString()
    orderBy?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    minPrice?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    maxPrice?: number;
}
