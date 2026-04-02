import { Field, InputType } from '@nestjs/graphql';
import { Transform, Type } from 'class-transformer';
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
import { ProductImageInput } from './product-image.input';
import { CreateProductVariationInput } from './create-product-variation.input';
import { TransformBoolean } from '../../../common/transforms';
import { StatusEnum } from '../../../common/enums';

@InputType()
export class CreateProductInput {
  @Field()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  @IsString()
  title: string;

  @Field()
  @IsOptional()
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

  /** Variations with options (value). Stock is not applied on create; use update to set initial stock per option. */
  @Field(() => [CreateProductVariationInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariationInput)
  variations?: CreateProductVariationInput[];

  @Field()
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
