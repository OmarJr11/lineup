import { StatusEnum } from '../common/enums';
import {
  BusinessSchema,
  CatalogSchema,
  DiscountProductSchema,
  ProductFileSchema,
  ProductRatingSchema,
  ProductReactionSchema,
  ProductSearchIndexSchema,
  ProductSkuSchema,
  ProductTagSchema,
  ProductVariationSchema,
  ProductVisitSchema,
} from '.';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProductSchema {
  @Field(() => Int)
  id: number;

  @Field()
  title: string;

  @Field({ nullable: true })
  subtitle?: string;

  @Field()
  description: string;

  @Field(() => Int)
  likes: number;

  @Field(() => Int)
  visits: number;

  /** Average star rating computed from all active ratings. */
  @Field(() => Float)
  ratingAverage: number;

  /** Lowest available SKU price for this product. */
  @Field(() => Float, { nullable: true })
  price?: number;

  @Field(() => Int)
  idCatalog: number;

  @Field(() => CatalogSchema, { nullable: true })
  catalog?: CatalogSchema;

  @Field(() => [ProductTagSchema], { nullable: true })
  productTags?: ProductTagSchema[];

  @Field(() => StatusEnum)
  status: StatusEnum;

  @Field(() => Int)
  idCreationBusiness: number;

  @Field(() => BusinessSchema, { nullable: true })
  business?: BusinessSchema;

  @Field(() => BusinessSchema, { nullable: true })
  modificationBusiness?: BusinessSchema;

  @Field(() => Date)
  creationDate: Date;

  @Field(() => [ProductFileSchema], { nullable: true })
  productFiles?: ProductFileSchema[];

  @Field()
  hasVariations: boolean;

  @Field(() => [ProductVariationSchema], { nullable: true })
  variations?: ProductVariationSchema[];

  @Field(() => [ProductSkuSchema], { nullable: true })
  skus?: ProductSkuSchema[];

  @Field(() => [ProductReactionSchema], { nullable: true })
  reactions?: ProductReactionSchema[];

  @Field(() => [ProductVisitSchema], { nullable: true })
  productVisits?: ProductVisitSchema[];

  @Field(() => [ProductSearchIndexSchema], { nullable: true })
  productSearchIndexes?: ProductSearchIndexSchema[];

  @Field(() => [ProductRatingSchema], { nullable: true })
  ratings?: ProductRatingSchema[];

  @Field(() => DiscountProductSchema, { nullable: true })
  discountProduct?: DiscountProductSchema;
}
