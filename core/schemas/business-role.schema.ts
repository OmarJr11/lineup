import { ObjectType, Field, Int } from '@nestjs/graphql';
import { StatusEnum } from '../common/enums/status.enum';
import { BusinessSchema, RoleSchema } from '.';
import { BaseSchema } from './base.schema';

@ObjectType()
export class BusinessRoleSchema extends BaseSchema {
  @Field(() => Int)
  idBusiness: number;

  @Field(() => Int)
  idRole: number;

  @Field(() => StatusEnum)
  status: StatusEnum;

  @Field(() => Int)
  idCreationBusiness: number;

  @Field(() => BusinessSchema, { nullable: true })
  creationBusiness?: BusinessSchema;

  @Field(() => RoleSchema, { nullable: true })
  role?: RoleSchema;

  @Field(() => BusinessSchema, { nullable: true })
  user?: BusinessSchema;
}