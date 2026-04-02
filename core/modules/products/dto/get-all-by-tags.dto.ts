import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayNotEmpty,
  IsOptional,
  IsString,
  Min,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';

/**
 * DTO for getAllByTags query arguments.
 */
@ArgsType()
export class GetAllByTagsArgs {
  @Field(() => [String], {
    description: 'Tag names or slugs (e.g. ["pan", "integral"]).',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tagNamesOrSlugs: string[];

  @Field(() => Int, {
    nullable: true,
    description: 'Optional business ID to filter products by business.',
  })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  idBusiness?: number;

  @Field(() => [Int], {
    nullable: true,
    description: 'Optional product IDs to exclude from results.',
  })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  idProducts?: number[];
}
