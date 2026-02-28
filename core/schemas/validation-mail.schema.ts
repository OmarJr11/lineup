import { ObjectType, Field, Int } from '@nestjs/graphql';
import { BaseSchema } from './base.schema';

/**
 * GraphQL schema for the ValidationMail entity.
 */
@ObjectType()
export class ValidationMailSchema extends BaseSchema {
  @Field(() => Int)
  id: number;

  @Field()
  email: string;

  @Field()
  code: string;

  @Field()
  isUsed: boolean;

  @Field()
  expiresAt: Date;
}
