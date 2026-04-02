import { BusinessSchema, DiscountSchema, ProductSchema } from '.';
import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * GraphQL schema for DiscountProduct.
 */
@ObjectType()
export class DiscountProductSchema {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  idProduct: number;

  @Field(() => ProductSchema, { nullable: true })
  product?: ProductSchema;

  @Field(() => Int)
  idDiscount: number;

  @Field(() => DiscountSchema, { nullable: true })
  discount?: DiscountSchema;

  @Field(() => Int)
  idCreationBusiness: number;

  @Field(() => BusinessSchema, { nullable: true })
  creationBusiness?: BusinessSchema;

  @Field({ nullable: true })
  creationDate?: Date;

  @Field({ nullable: true })
  modificationDate?: Date;
}
