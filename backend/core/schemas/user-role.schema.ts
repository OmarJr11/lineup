import { ObjectType, Field, Int } from '@nestjs/graphql';
import { StatusEnum } from '../common/enums/status.enum';
import { RoleSchema, UserSchema } from '.';
import { BaseSchema } from './base.schema';

@ObjectType()
export class UserRoleSchema extends BaseSchema {
  @Field(() => Int)
  idUser: number;

  @Field(() => Int)
  idRole: number;

  @Field(() => StatusEnum)
  status: StatusEnum;

  @Field(() => Int)
  idCreationUser: number;

  @Field(() => UserSchema, { nullable: true })
  creationUser?: UserSchema;

  @Field(() => RoleSchema, { nullable: true })
  role?: RoleSchema;

  @Field(() => UserSchema, { nullable: true })
  user?: UserSchema;
}