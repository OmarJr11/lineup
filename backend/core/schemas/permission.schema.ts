import { ObjectType, Field, Int } from '@nestjs/graphql';
import { StatusEnum } from '../common/enums/status.enum';
import { RolePermissionSchema, UserSchema } from '.';
import { BaseSchema } from './base.schema';

@ObjectType()
export class PermissionSchema extends BaseSchema {
  @Field(() => Int)
  id: number;

  @Field()
  code: string;

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

  @Field(() => [RolePermissionSchema], { nullable: true })
  rolePermissions?: RolePermissionSchema[];
}