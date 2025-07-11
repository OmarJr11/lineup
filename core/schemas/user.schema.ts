import { ObjectType, Field, Int } from '@nestjs/graphql';
import { StatusEnum } from '../common/enums/status.enum';
import { ProvidersEnum } from '../common/enums';
import { FileSchema, RoleSchema, UserRoleSchema } from '.';
import { BaseSchema } from './base.schema';

@ObjectType()
export class UserSchema extends BaseSchema {
  @Field(() => Int)
  id: number;

  @Field()
  email: string;

  @Field({ nullable: true })
  emailValidated?: boolean;

  @Field()
  username: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field(() => StatusEnum)
  status: StatusEnum;

  @Field(() => ProvidersEnum)
  provider: ProvidersEnum;

  @Field(() => [RoleSchema], { nullable: true })
  createdRoles?: RoleSchema[];

  @Field(() => [RoleSchema], { nullable: true })
  modifiedRoles?: RoleSchema[];

  @Field(() => [UserRoleSchema], { nullable: true })
  createdUserRoles?: UserRoleSchema[];

  @Field(() => [UserRoleSchema], { nullable: true })
  userRoles?: UserRoleSchema[];

  @Field(() => [FileSchema], { nullable: true })
  files?: FileSchema[];
}