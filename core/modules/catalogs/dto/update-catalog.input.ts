import { InputType, Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength, IsArray, IsEmpty } from 'class-validator';

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

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    imageCode?: string;

    @Field(() => [String], { nullable: true })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsEmpty()
    path?: string;
}