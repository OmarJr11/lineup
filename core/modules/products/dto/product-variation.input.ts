import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsEmpty, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class ProductVariationInput {
    @Field({ nullable: true })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    id?: number;

    @Field()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(255)
    @IsString()
    title: string;

    @Field(() => [String])
    @IsNotEmpty()
    @IsArray()
    @IsString({ each: true })
    options: string[];

    @IsEmpty()
    idProduct: number;
}
