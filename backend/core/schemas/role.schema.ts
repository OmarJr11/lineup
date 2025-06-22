import { ObjectType, Field, Int } from '@nestjs/graphql';
import { RolesCodesEnum, StatusEnum } from '../common/enums';
import { RolePermissionSchema, UserRoleSchema, UserSchema } from '.';
import { BaseSchema } from './base.schema';

@ObjectType()
export class RoleSchema extends BaseSchema {
  @Field(() => Int)
  id: number;

  @Field(() => RolesCodesEnum)
  code: RolesCodesEnum;

  @Field()
  description: string;

  @Field(() => StatusEnum)
  status: StatusEnum;

  @Field(() => Int)
  idCreationUser: number;

  @Field(() => UserSchema, { nullable: true })
  creationUser?: UserSchema;

  @Field(() => UserSchema, { nullable: true })
  modificationUser?: UserSchema;

  @Field(() => [UserRoleSchema], { nullable: true })
  userRoles?: UserRoleSchema[];

  @Field(() => [RolePermissionSchema], { nullable: true })
  rolePermissions?: RolePermissionSchema[];
}