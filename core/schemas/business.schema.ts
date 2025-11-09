import { ObjectType, Field, Int } from '@nestjs/graphql';
import { StatusEnum } from '../common/enums/status.enum';
import { FileSchema } from './file.schema';
import { ProvidersEnum } from '../common/enums';
import { BusinessRoleSchema, CatalogSchema, LocationSchema, ProductSchema } from '.';

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
}