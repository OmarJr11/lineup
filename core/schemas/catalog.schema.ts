import { StatusEnum } from '../common/enums';
import {
  BusinessSchema,
  CatalogSearchIndexSchema,
  CatalogVisitSchema,
  DiscountSchema,
  FileSchema,
  ProductSchema,
  ProductSearchIndexSchema,
} from '.';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CatalogSchema {
  @Field(() => Int)
  id: number;

  @Field()
  title: string;

  @Field({ nullable: true })
  imageCode?: string;

  @Field(() => FileSchema, { nullable: true })
  image?: FileSchema;

  @Field()
  path: string;

  @Field(() => StatusEnum)
  status: StatusEnum;

  @Field(() => Int)
  idCreationBusiness: number;

  @Field(() => Int)
  visits: number;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => Int)
  productsCount: number;

  @Field(() => BusinessSchema, { nullable: true })
  business?: BusinessSchema;

  @Field(() => BusinessSchema, { nullable: true })
  modificationBusiness?: BusinessSchema;

  @Field(() => [ProductSchema], { nullable: true })
  products?: ProductSchema[];

  @Field(() => [CatalogVisitSchema], { nullable: true })
  catalogVisits?: CatalogVisitSchema[];

  @Field(() => [CatalogSearchIndexSchema], { nullable: true })
  catalogSearchIndexes?: CatalogSearchIndexSchema[];

  @Field(() => [ProductSearchIndexSchema], { nullable: true })
  productSearchIndexes?: ProductSearchIndexSchema[];

  @Field(() => [DiscountSchema], { nullable: true })
  discounts?: DiscountSchema[];
}
