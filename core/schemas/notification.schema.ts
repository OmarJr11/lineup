import GraphQLJSON from 'graphql-type-json';
import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { NotificationTypeEnum } from '../common/enums/notification-type.enum';
import type { INotificationPayload } from '../common/interfaces/notification-payload.interface';
import { UserSchema } from './user.schema';
import { BusinessSchema } from './business.schema';

registerEnumType(NotificationTypeEnum, {
  name: 'NotificationTypeEnum',
  description: 'Notification category for UI and filtering',
});

/**
 * GraphQL projection for a persisted in-app notification.
 */
@ObjectType()
export class NotificationSchema {
  @Field(() => Int)
  id: number;

  @Field(() => NotificationTypeEnum)
  type: NotificationTypeEnum;

  @Field()
  title: string;

  @Field()
  body: string;

  @Field(() => GraphQLJSON, { nullable: true })
  payload?: INotificationPayload;

  @Field(() => Int)
  idCreationUser: number;

  @Field(() => UserSchema, { nullable: true })
  user?: UserSchema;

  @Field(() => Int, { nullable: true })
  idCreationBusiness?: number;

  @Field(() => BusinessSchema, { nullable: true })
  business?: BusinessSchema;

  @Field(() => Date, { nullable: true })
  readAt?: Date;

  @Field(() => Date)
  creationDate: Date;
}
