import {
  DiscountScopeEnum,
  DiscountTypeEnum,
  StatusEnum,
} from '../common/enums';
import {
  BusinessSchema,
  CatalogSchema,
  CurrencySchema,
  DiscountProductSchema,
} from '.';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

/**
 * GraphQL schema for Discount.
 */
@ObjectType()
export class DiscountSchema {
  @Field(() => Int)
  id: number;

  @Field(() => DiscountTypeEnum)
  discountType: DiscountTypeEnum;

  @Field(() => Float)
  value: number;

  @Field(() => Int, { nullable: true })
  idCurrency?: number;

  @Field(() => CurrencySchema, { nullable: true })
  currency?: CurrencySchema;

  @Field()
  startDate: Date;

  @Field()
  endDate: Date;

  @Field(() => DiscountScopeEnum)
  scope: DiscountScopeEnum;

  @Field(() => StatusEnum)
  status: StatusEnum;

  @Field(() => Int, { nullable: true })
  idCatalog?: number;

  @Field(() => CatalogSchema, { nullable: true })
  catalog?: CatalogSchema;

  @Field(() => Int)
  idCreationBusiness: number;

  /** Business that created/applies to (when scope=business, this is the business the discount applies to). */
  @Field(() => BusinessSchema, { nullable: true })
  business?: BusinessSchema;

  @Field(() => BusinessSchema, { nullable: true })
  modificationBusiness?: BusinessSchema;

  @Field({ nullable: true })
  creationDate?: Date;

  @Field({ nullable: true })
  modificationDate?: Date;

  @Field(() => [DiscountProductSchema], { nullable: true })
  discountProducts?: DiscountProductSchema[];
}
