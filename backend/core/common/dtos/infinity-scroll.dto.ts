import { Type } from 'class-transformer';
import {
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Validate,
} from 'class-validator';
import { ValidateOrder } from '../decorators';
import { OrderEnum } from '../enums';
import { ApiProperty } from '@nestjs/swagger';

export class InfinityScrollDto {
    @ApiProperty({
        description: 'Page number for pagination',
        type: Number,
        example: 1,
        required: true,
        minimum: 1,
        default: 1,
    })
    @IsNotEmpty()
    @Type(() => Number)
    @IsInt()
    page: number;

    @ApiProperty({
        description: 'Number of items per page',
        type: Number,
        example: 10,
        required: false,
        minimum: 1,
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    limit?: number;

    @ApiProperty({
        description: 'Order direction for sorting',
        enum: OrderEnum,
        example: OrderEnum.ASC,
        required: false,
    })
    @IsOptional()
    @Validate(ValidateOrder)
    order?: OrderEnum;

    @ApiProperty({
        description: 'Field to order by',
        example: 'creation_date',
        required: false,
    })
    @IsOptional()
    @IsString()
    orderBy?: string;

    @ApiProperty({
        description: 'Search term for filtering results',
        example: 'example',
        required: false,
    })
    @IsOptional()
    @IsString()
    search?: string;


    @ApiProperty({
        description: 'Timestamp for filtering results',
        example: '2023-10-01T00:00:00Z',
        required: false,
    })
    @IsOptional()
    @IsString()
    timestamp?: string;
}
