import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, IsUrl } from 'class-validator';

@InputType()
export class CreateLocationInput {
  @Field()
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
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  googleMapsUrl?: string;
}
