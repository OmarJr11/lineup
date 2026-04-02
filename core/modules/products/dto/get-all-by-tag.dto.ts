import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/**
 * DTO for getAllByTag query arguments.
 */
@ArgsType()
export class GetAllByTagArgs {
  @Field(() => String, {
    description: 'Tag name or slug (e.g. "pan" or "pan-artesanal").',
  })
  @IsNotEmpty()
  @Type(() => String)
  @IsString()
  tagNameOrSlug: string;

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
