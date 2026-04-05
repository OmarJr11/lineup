import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { StockMovementTypeEnum } from '../common/enums';
import { BusinessSchema, ProductSkuSchema } from '.';

/**
 * GraphQL schema for StockMovement.
 */
@ObjectType()
export class StockMovementSchema {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  idProductSku: number;

  @Field(() => ProductSkuSchema, { nullable: true })
  productSku?: ProductSkuSchema;

  @Field(() => Int)
  idCreationBusiness: number;

  @Field(() => BusinessSchema, { nullable: true })
  business?: BusinessSchema;

  @Field(() => StockMovementTypeEnum)
  type: StockMovementTypeEnum;

  @Field(() => Int)
  quantityDelta: number;

  @Field(() => Int)
  previousQuantity: number;

  @Field(() => Int)
  newQuantity: number;

  @Field(() => Float, { nullable: true })
  price?: number;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  creationDate: Date;
}
