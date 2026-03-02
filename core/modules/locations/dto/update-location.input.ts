import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CreateLocationInput } from './create-location.input';
import { InputType, Field, Int, PartialType, Float } from '@nestjs/graphql';
import { Type } from 'class-transformer';

@InputType()
export class UpdateLocationInput {
    @Field(() => Int)
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    id: number;

    /** User-defined label for this location. */
    @Field({ nullable: true })
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    name?: string;

    @Field(() => Float)
    @IsOptional()
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    lat?: number;
  
    @Field(() => Float)
    @IsOptional()
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    lng?: number;
  
    @Field()
    @IsOptional()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(255)
    @IsString()
    address?: string;
  
    @Field()
    @IsOptional()
    @IsNotEmpty()
    @MinLength(3)
    @IsString()
    formattedAddress?: string;
}
