import GraphQLJSON from 'graphql-type-json';
import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * GraphQL projection for notification JSONB metadata (routing and UI actions).
 */
@ObjectType()
export class NotificationPayloadSchema {
  @Field(() => Int, { nullable: true })
  idUser?: number;

  @Field(() => Int, { nullable: true })
  idBusiness?: number;

  @Field({ nullable: true })
  link?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  data?: object;

  @Field({ nullable: true })
  entity?: string;

  @Field({ nullable: true })
  scenario?: string;

  @Field(() => Int, { nullable: true })
  id?: number;
}
