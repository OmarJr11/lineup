import { Field, Float, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class CreateLocationInput {
  @Field(() => Float)
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  lat: number;

  @Field(() => Float)
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  lng: number;

  @Field()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  @IsString()
  address: string;

  @Field()
  @IsNotEmpty()
  @MinLength(3)
  @IsString()
  formattedAddress: string;
}
