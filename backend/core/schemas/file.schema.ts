import { ObjectType, Field, Int } from '@nestjs/graphql';
import { UserSchema } from './user.schema';
import { BaseSchema } from './base.schema';

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

  @Field(() => Int)
  idCreationUser: number;

  @Field(() => UserSchema, { nullable: true })
  creationUser?: UserSchema;

  // Si necesitas exponer thumbnails o tags, descomenta y define los tipos correspondientes
  // @Field(() => ThumbnailsObjectType, { nullable: true })
  // thumbnails?: ThumbnailsObjectType;

  // @Field(() => GraphQLJSON, { nullable: true })
  // tags?: any;
}