import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

/**
 * Input for querying primary products by business, optionally scoped to a catalog.
 */
@InputType()
export class GetAllPrimaryProductsByBusinessInput {
  @Field(() => Int, { description: 'Business ID.' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  idBusiness: number;

  @Field(() => Int, {
    nullable: true,
    description:
      'When set, only primary products belonging to this catalog are returned.',
  })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  idCatalog?: number;
}
