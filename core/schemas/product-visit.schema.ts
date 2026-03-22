import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ProductSchema, UserSchema } from '.';

/**
 * GraphQL ObjectType representing a visit record to a product.
 * Supports logged-in users (idCreationUser) or anonymous visits (idCreationUser null).
 */
@ObjectType()
export class ProductVisitSchema {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  idProduct: number;

  @Field(() => ProductSchema, { nullable: true })
  product?: ProductSchema;

  @Field(() => Int, { nullable: true })
  idCreationUser?: number;

  @Field(() => UserSchema, { nullable: true })
  creationUser?: UserSchema;
}
