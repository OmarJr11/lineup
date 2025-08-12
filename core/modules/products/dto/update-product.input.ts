import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class UpdateProductInput {
  @Field()
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  id?: number;

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
}
