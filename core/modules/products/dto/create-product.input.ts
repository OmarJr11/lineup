import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { ProductImageInput } from './product-image.input';
import { ProductVariationInput } from './product-variation.input';

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

    @Field(() => [ProductImageInput])
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductImageInput)
    images: ProductImageInput[];

    @Field(() => [String])
    @IsNotEmpty()
    @IsArray()
    @IsString({ each: true })
    tags: string[];

    @Field(() => [ProductVariationInput], { nullable: true })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductVariationInput)
    variations?: ProductVariationInput[];
}
