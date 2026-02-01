import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class UpdateProductFileInput {
    @Field()
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    id: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    imageCode?: string;

    @Field(() => Number, { nullable: true })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    idProduct?: number;

    @Field(() => Number, { nullable: true })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    order?: number;
}
