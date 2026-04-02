import { Field, InputType } from '@nestjs/graphql';
import {
  IsArray,
  IsBoolean,
  IsEmpty,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProductImageInput } from './product-image.input';
import { ProductVariationInput } from './product-variation.input';
import { TransformBoolean } from '../../../common/transforms';
import { StatusEnum } from '../../../common/enums';

@InputType()
export class UpdateProductInput {
  @Field()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  id: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  @IsString()
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  @IsString()
  subtitle?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  description?: string;

  @Field({ nullable: true })
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

  @Field(() => [ProductVariationInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariationInput)
  variations?: ProductVariationInput[];

  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @Transform(TransformBoolean)
  @IsBoolean()
  isPrimary?: boolean;

  @IsEmpty()
  hasVariations?: boolean;

  @IsEmpty()
  status?: StatusEnum;
}
