import { Field, Int, ObjectType } from '@nestjs/graphql';
import { StatusEnum } from '../common/enums';
import { UserSchema } from './user.schema';
import { BaseSchema } from './base.schema';

/**
 * GraphQL schema for State (geographic subdivision of a country).
 */
@ObjectType()
export class StateSchema extends BaseSchema {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  code?: string;

  @Field({ nullable: true })
  capital?: string;

  @Field(() => StatusEnum)
  status: StatusEnum;

  @Field(() => Int)
  idCreationUser: number;

  @Field(() => UserSchema, { nullable: true })
  creationUser?: UserSchema;

  @Field(() => UserSchema, { nullable: true })
  modificationUser?: UserSchema;
}
