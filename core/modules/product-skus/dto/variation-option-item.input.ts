import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Single variation option (e.g. Color: "Rojo").
 * Used to identify a SKU by its variation combination.
 */
@InputType()
export class VariationOptionItemInput {
    @Field()
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    variationTitle: string;

    @Field()
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    option: string;
}
