import { Field, Int, ObjectType } from '@nestjs/graphql';
import { BusinessSchema } from './business.schema';
import { CatalogSchema } from './catalog.schema';
import { ProductSchema } from './product.schema';

/**
 * GraphQL schema that groups all featured collections in one response.
 */
@ObjectType()
export class FeaturedCollectionsSchema {
  @Field(() => [BusinessSchema])
  featuredBusinesses: BusinessSchema[];

  @Field(() => [CatalogSchema])
  featuredCatalogs: CatalogSchema[];

  @Field(() => [ProductSchema])
  featuredProducts: ProductSchema[];

  @Field(() => [ProductSchema])
  recentlyAddedProducts: ProductSchema[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}
