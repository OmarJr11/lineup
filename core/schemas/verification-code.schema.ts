import { ObjectType, Field, Int } from '@nestjs/graphql';
import { BusinessSchema, UserSchema } from '.';
import { BaseSchema } from './base.schema';
import { StatusEnum, VerificationCodeChannelEnum } from '../common/enums';

/**
 * GraphQL schema for the VerificationCode entity.
 */
@ObjectType()
export class VerificationCodeSchema extends BaseSchema {
  @Field(() => Int)
  id: number;

  @Field(() => Int, { nullable: true })
  idUser?: number;

  @Field(() => UserSchema, { nullable: true })
  user?: UserSchema;

  @Field(() => Int, { nullable: true })
  idBusiness?: number;

  @Field(() => BusinessSchema, { nullable: true })
  business?: BusinessSchema;

  @Field(() => VerificationCodeChannelEnum)
  channel: VerificationCodeChannelEnum;

  @Field()
  destination: string;

  @Field()
  code: string;

  @Field()
  isUsed: boolean;

  @Field()
  expiresAt: Date;

  @Field(() => StatusEnum)
  status: StatusEnum;
}
