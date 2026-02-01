import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsEmpty, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class ProductImageInput {
    @Field()
    @IsNotEmpty()
    @IsString()
    @MaxLength(50)
    imageCode: string;

    @Field(() => Number)
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    order: number;

    @IsEmpty()
    idProduct: number;
}
