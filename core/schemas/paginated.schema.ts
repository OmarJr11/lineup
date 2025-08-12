import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Type } from '@nestjs/common';
import { UserSchema } from './user.schema';
import { BusinessSchema } from './business.schema';
import { CatalogSchema } from './catalog.schema';
import { ProductSchema } from './product.schema';

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

@ObjectType()
export class PaginatedCatalogs extends PaginatedResponse(CatalogSchema) {}

@ObjectType()
export class PaginatedProducts extends PaginatedResponse(ProductSchema) {}