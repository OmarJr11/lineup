import { ObjectType, Field, Int } from '@nestjs/graphql';
import { StatusEnum } from '../common/enums/status.enum';
import { FileSchema } from './file.schema';
import { ProvidersEnum } from '../common/enums';
import {
  BusinessFollowerSchema,
  BusinessRoleSchema,
  CatalogSchema,
  LocationSchema,
  ProductFileSchema,
  ProductSchema,
  ProductVariationSchema
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
}