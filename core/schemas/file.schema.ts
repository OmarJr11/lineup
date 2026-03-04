import { ObjectType, Field, Int } from '@nestjs/graphql';
import {
  BaseSchema,
  BusinessSchema,
  CatalogSchema,
  ProductFileSchema,
  SocialNetworkSchema,
  UserSchema,
} from '.';
  
@ObjectType()
export class FileSchema extends BaseSchema {
  @Field()
  name: string;

  @Field()
  extension: string;

  @Field()
  directory: string;

  @Field()
  url: string;

  @Field(() => Int, { nullable: true })
  idCreationUser?: number;

  @Field(() => UserSchema, { nullable: true })
  creationUser?: UserSchema;

  @Field(() => Int, { nullable: true })
  idCreationBusiness?: number;

  @Field(() => BusinessSchema, { nullable: true })
  creationBusiness?: BusinessSchema;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => [BusinessSchema], { nullable: true })
  businessFiles?: BusinessSchema[];

  @Field(() => [UserSchema], { nullable: true })
  userProfileImages?: UserSchema[];

  @Field(() => [CatalogSchema], { nullable: true })
  catalogFiles?: CatalogSchema[];

  @Field(() => [SocialNetworkSchema], { nullable: true })
  socialNetworkFiles?: SocialNetworkSchema[];

  @Field(() => [ProductFileSchema], { nullable: true })
  productFiles?: ProductFileSchema[];
}