import { ObjectType, Field, Int } from '@nestjs/graphql';
import {
  BaseSchema,
  BusinessSchema,
  UserSchema
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

  // Si necesitas exponer thumbnails o tags, descomenta y define los tipos correspondientes
  // @Field(() => ThumbnailsObjectType, { nullable: true })
  // thumbnails?: ThumbnailsObjectType;

  // @Field(() => GraphQLJSON, { nullable: true })
  // tags?: any;
}