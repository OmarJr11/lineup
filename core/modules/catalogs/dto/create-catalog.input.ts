import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MaxLength, MinLength, IsOptional, IsArray, IsEmpty } from 'class-validator';

@InputType()
export class CreateCatalogInput {
    @Field()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(255)
    @IsString()
    title: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    imageCode?: string;

    @Field(() => [String], { nullable: true })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    path?: string;
}