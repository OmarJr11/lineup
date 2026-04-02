import { Field, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

@InputType()
export class CreateStateInput {
  @Field()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @MinLength(2)
  @MaxLength(10)
  @IsString()
  code?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(100)
  @IsString()
  capital?: string;
}
