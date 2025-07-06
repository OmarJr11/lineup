import { ObjectType, Field, Int } from '@nestjs/graphql';
import { BusinessSchema, UserSchema } from '.';
import { Type } from '@nestjs/common';

export function PaginatedResponse<TItem>(TClass: Type<TItem>) {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedResponseClass {
    @Field(() => [TClass])
    items: TItem[];

    @Field(() => Int)
    total: number;

    @Field(() => Int)
    page: number;

    @Field(() => Int)
    limit: number;
  }
  return PaginatedResponseClass;
}

@ObjectType()
export class PaginatedUsers extends PaginatedResponse(UserSchema) {}

@ObjectType()
export class PaginatedBusinesses extends PaginatedResponse(BusinessSchema) {}