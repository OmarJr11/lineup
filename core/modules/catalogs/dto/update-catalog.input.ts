import { InputType, Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class UpdateCatalogInput {
    @Field()
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    idCatalog: number;

    @Field()
    @IsOptional()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(255)
    @IsString()
    title?: string;
}