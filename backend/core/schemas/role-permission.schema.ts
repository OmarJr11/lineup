import { ObjectType, Field, Int } from '@nestjs/graphql';
import { PermissionSchema, RoleSchema, UserSchema } from '.';
import { BaseSchema } from './base.schema';

@ObjectType()
export class RolePermissionSchema extends BaseSchema {
  @Field(() => Int)
  idRole: number;

  @Field(() => Int)
  idPermission: number;

  @Field(() => Int)
  idCreationUser: number;

  @Field(() => UserSchema, { nullable: true })
  creationUser?: UserSchema;

  @Field(() => UserSchema, { nullable: true })
  modificationUser?: UserSchema;

  @Field(() => RoleSchema, { nullable: true })
  role?: RoleSchema;

  @Field(() => PermissionSchema, { nullable: true })
  permission?: PermissionSchema;
}