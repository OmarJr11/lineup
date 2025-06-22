import { ObjectType, Field, Int } from '@nestjs/graphql';
import { UserSchema } from '.';
import { BaseSchema } from './base.schema';

@ObjectType()
export class TokenSchema extends BaseSchema {
  @Field(() => Int)
  idUser: number;

  @Field(() => UserSchema, { nullable: true })
  user?: UserSchema;

  @Field()
  token: string;

  @Field()
  refresh: string;
}