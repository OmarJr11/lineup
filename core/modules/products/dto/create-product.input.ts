import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class CreateProductInput {
    @Field()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(255)
    @IsString()
    title: string;

    @Field()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(255)
    @IsString()
    subtitle: string;

    @Field()
    @IsNotEmpty()
    @IsString()
    description: string;

    @Field()
    @IsOptional()
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    price?: number;

    @Field()
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    idCatalog: number;
}
