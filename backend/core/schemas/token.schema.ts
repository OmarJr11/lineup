import { ObjectType, Field, Int } from '@nestjs/graphql';
import { BusinessSchema, UserSchema } from '.';
import { BaseSchema } from './base.schema';

@ObjectType()
export class TokenSchema extends BaseSchema {
  @Field(() => Int) 
  id: number;

  @Field(() => Int)
  idUser: number;

  @Field(() => UserSchema, { nullable: true })
  user?: UserSchema;

  @Field(() => Int)
  idBusiness: number;

  @Field(() => BusinessSchema, { nullable: true })
  business?: BusinessSchema;

  @Field()
  token: string;

  @Field()
  refresh: string;
}