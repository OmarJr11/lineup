import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductImageInput } from './product-image.input';
import { ProductVariationInput } from './product-variation.input';

@InputType()
export class UpdateProductInput {
  @Field()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  id: number;

  @Field()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  @IsString()
  title?: string;

  @Field()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  @IsString()
  subtitle?: string;

  @Field()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  description?: string;

  @Field()
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @Field()
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  idCatalog?: number;

  @Field(() => [ProductImageInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageInput)
  images?: ProductImageInput[];

  @Field(() => [String])
  @IsOptional()
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
