import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { BaseSchema } from './base.schema';
import { BusinessSchema } from './business.schema';
import { UserSchema } from './user.schema';
import { CartItemSchema } from './cart-item.schema';

@ObjectType()
/** GraphQL representation of a user's business-specific cart. */
export class CartSchema extends BaseSchema {
  /** Cart identifier. @type {number} */
  /** Cart owner identifier. @type {number} */
  /** Cart owner. @type {UserSchema | undefined} */
  /** Business identifier. @type {number} */
  /** Business associated with the cart. @type {BusinessSchema | undefined} */
  /** Cart line items. @type {CartItemSchema[] | undefined} */
  /** Cart total. @type {number} */
  /** Total number of units. @type {number} */
  /** Last cart activity timestamp. @type {Date | undefined} */
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  idCreationUser: number;

  @Field(() => UserSchema, { nullable: true })
  creationUser?: UserSchema;

  @Field(() => Int)
  idBusiness: number;

  @Field(() => BusinessSchema, { nullable: true })
  business?: BusinessSchema;

  @Field(() => [CartItemSchema], { nullable: true })
  items?: CartItemSchema[];

  @Field(() => Float)
  total: number;

  @Field(() => Int)
  itemsCount: number;

  @Field(() => Date, { nullable: true })
  lastActivityDate?: Date;
}
