import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class UpdateCurrencyInput {
    @Field()
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    id: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    @IsString()
    name?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(10)
    @IsString()
    code?: string;
}
