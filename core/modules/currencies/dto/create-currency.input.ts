import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class CreateCurrencyInput {
    @Field()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    @IsString()
    name: string;

    @Field()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(10)
    @IsString()
    code: string;
}
