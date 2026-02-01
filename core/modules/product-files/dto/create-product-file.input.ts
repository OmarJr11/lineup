import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class CreateProductFileInput {
    @Field()
    @IsNotEmpty()
    @IsString()
    @MaxLength(50)
    imageCode: string;

    @Field()
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    idProduct: number;

    @Field(() => Number, { nullable: true })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    order?: number;
}
