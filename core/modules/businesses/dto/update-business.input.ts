import { InputType, Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class UpdateBusinessInput {
  @Field(() => Number)
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  id: number;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(50)
  @IsString()
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(100)
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(255)
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(30)
  @IsString()
  telephone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(50)
  @IsString()
  imageCode?: string;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(50)
  @IsString()
  path?: string;
}
