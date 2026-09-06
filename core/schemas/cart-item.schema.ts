import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { BaseSchema } from './base.schema';
import { ProductSchema } from './product.schema';
import { ProductSkuSchema } from './product-sku.schema';

@ObjectType()
/** GraphQL representation of a cart line item. */
export class CartItemSchema extends BaseSchema {
  /** Item identifier. @type {number} */
    /** Parent cart identifier. @type {number} */
    /** Product identifier. @type {number} */
    /** Product relation. @type {ProductSchema | undefined} */
    /** Optional SKU identifier. @type {number | undefined} */
    /** SKU relation. @type {ProductSkuSchema | undefined} */
    /** Selected quantity. @type {number} */
    /** Unit price. @type {number} */
    /** Line subtotal. @type {number} */
    /** Selected variation values. @type {Record<string, string> | undefined} */
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  idCart: number;

  @Field(() => Int)
  idProduct: number;

  @Field(() => ProductSchema, { nullable: true })
  product?: ProductSchema;

  @Field(() => Int, { nullable: true })
  idProductSku?: number;

  @Field(() => ProductSkuSchema, { nullable: true })
  productSku?: ProductSkuSchema;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  subtotal: number;

  @Field(() => String, { nullable: true })
  variationOptions?: Record<string, string>;
}