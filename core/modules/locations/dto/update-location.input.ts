import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';
import { CreateLocationInput } from './create-location.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { Type } from 'class-transformer';

@InputType()
export class UpdateLocationInput {
    @Field(() => Int)
    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    id: number;

    @Field()
    @IsOptional()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(255)
    @IsString()
    address: string;
  
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    addressComponents?: string;
  
    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    @IsUrl()
    googleMapsUrl?: string;
}
