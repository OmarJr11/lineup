import { ObjectType, Field, Int } from '@nestjs/graphql';
import { StatusEnum } from '../common/enums/status.enum';
import { FileSchema } from './file.schema';
import { ProvidersEnum } from '../common/enums';
import {
  BusinessFollowerSchema,
  BusinessRoleSchema,
  BusinessVisitSchema,
  CatalogSchema,
  LocationSchema,
  ProductFileSchema,
  ProductSkuSchema,
  ProductSchema,
  ProductVariationSchema,
  DiscountSchema,
  DiscountProductSchema,
  EntityAuditSchema,
} from '.';

@ObjectType()
export class BusinessSchema {
  @Field(() => Int)
  id: number;

  @Field()
  email: string;

  @Field()
  emailValidated: boolean;

  @Field(() => ProvidersEnum)
  provider: ProvidersEnum;

  @Field({ nullable: true })
  telephone?: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  path: string;

  @Field({ nullable: true })
  imageCode?: string;

  @Field(() => FileSchema, { nullable: true })
  image?: FileSchema;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => Int)
  followers: number;

  @Field(() => Int)
  visits: number;

  @Field({ description: 'Whether the business operates online' })
  isOnline: boolean;

  @Field(() => StatusEnum)
  status: StatusEnum;

  @Field(() => [BusinessRoleSchema], { nullable: true })
  businessRoles?: BusinessRoleSchema[];

  @Field(() => [ProductSchema], { nullable: true })
  products?: ProductSchema[];

  @Field(() => [CatalogSchema], { nullable: true })
  catalogs?: CatalogSchema[];

  @Field(() => [LocationSchema], { nullable: true })
  locations?: LocationSchema[];

  @Field(() => [FileSchema], { nullable: true })
  files?: FileSchema[];

  @Field(() => [ProductVariationSchema], { nullable: true })
  productVariations?: ProductVariationSchema[];

  @Field(() => [ProductVariationSchema], { nullable: true })
  modifiedProductVariations?: ProductVariationSchema[];

  @Field(() => [ProductFileSchema], { nullable: true })
  productFiles?: ProductFileSchema[];

  @Field(() => [ProductFileSchema], { nullable: true })
  modifiedProductFiles?: ProductFileSchema[];

  @Field(() => [BusinessFollowerSchema], { nullable: true })
  businessFollowers?: BusinessFollowerSchema[];

  @Field(() => [BusinessVisitSchema], { nullable: true })
  businessVisits?: BusinessVisitSchema[];

  @Field(() => [ProductSkuSchema], { nullable: true })
  productSkus?: ProductSkuSchema[];

  @Field(() => [DiscountSchema], { nullable: true })
  discounts?: DiscountSchema[];

  @Field(() => [DiscountSchema], { nullable: true })
  modifiedDiscounts?: DiscountSchema[];

  @Field(() => [DiscountProductSchema], { nullable: true })
  creationDiscountProducts?: DiscountProductSchema[];

  @Field(() => [EntityAuditSchema], { nullable: true })
  creationEntityAudits?: EntityAuditSchema[];
}
