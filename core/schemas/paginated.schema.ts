import { createUnionType, ObjectType, Field, Int } from '@nestjs/graphql';
import { Type } from '@nestjs/common';
import { UserSchema } from './user.schema';
import { BusinessSchema } from './business.schema';
import { CatalogSchema } from './catalog.schema';
import { ProductSchema } from './product.schema';
import { LocationSchema } from './location.schema';
import { ProductRatingSchema } from './product-rating.schema';

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

@ObjectType()
export class PaginatedLocations extends PaginatedResponse(LocationSchema) {}

@ObjectType()
export class PaginatedProductRatings extends PaginatedResponse(ProductRatingSchema) {}

/** Union type for search results: Business, Catalog, or Product */
export const SearchResultItem = createUnionType({
    name: 'SearchResultItem',
    types: () => [BusinessSchema, CatalogSchema, ProductSchema] as const,
    resolveType(value: { __typename?: string }) {
        if (value.__typename === 'BusinessSchema') return BusinessSchema;
        if (value.__typename === 'CatalogSchema') return CatalogSchema;
        if (value.__typename === 'ProductSchema') return ProductSchema;
        return null;
    },
});

@ObjectType()
export class PaginatedSearchResults {
    @Field(() => [SearchResultItem])
    items: object[];

    @Field(() => Int)
    total: number;

    @Field(() => Int)
    page: number;

    @Field(() => Int)
    limit: number;
}
