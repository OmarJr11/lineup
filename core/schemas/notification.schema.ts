import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { NotificationTypeEnum } from '../common/enums/notification-type.enum';
import { BusinessSchema } from './business.schema';
import { NotificationPayloadSchema } from './notification-payload.schema';
import { UserSchema } from './user.schema';

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

  @Field(() => NotificationPayloadSchema, { nullable: true })
  payload?: NotificationPayloadSchema;

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
