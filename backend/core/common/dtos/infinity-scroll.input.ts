import { InputType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, Validate } from 'class-validator';
import { OrderEnum } from '../enums';
import { ValidateOrder } from '../decorators';

@InputType()
export class InfinityScrollInput {
  @Field(() => Int)
  @IsInt()
  page: number = 1;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  limit?: number = 10;

  @Field(() => OrderEnum, { nullable: true })
  @IsOptional()
  @Validate(ValidateOrder)
  order?: OrderEnum;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  orderBy?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  timestamp?: string;
}