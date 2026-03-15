import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Single option within a variation for creation (e.g. "Rojo").
 * Stock is not applied on create; use update to set initial stock per option.
 */
@InputType()
export class CreateProductVariationOptionInput {
    @Field()
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    value: string;
}
