import { ObjectType, Field, Int } from '@nestjs/graphql';
import { StatusEnum } from '../common/enums/status.enum';
import { FileSchema } from './file.schema';
import { ProvidersEnum } from '../common/enums';
import { BusinessRoleSchema, RoleSchema } from '.';

@ObjectType()
export class BusinessSchema {
  @Field(() => Int)
  id: number;

  @Field()
  email: string;

  @Field({ nullable: true })
  telephone?: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  path: string;

  @Field()
  imageCode: string;

  @Field(() => FileSchema, { nullable: true })
  image?: FileSchema;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => StatusEnum)
  status: StatusEnum;

  @Field(() => ProvidersEnum)
  provider: ProvidersEnum;

  @Field(() => [RoleSchema], { nullable: true })
  createdRoles?: RoleSchema[];

  @Field(() => [RoleSchema], { nullable: true })
  modifiedRoles?: RoleSchema[];

  @Field(() => [BusinessRoleSchema], { nullable: true })
  createdBusinessRoles?: BusinessRoleSchema[];

  @Field(() => [BusinessRoleSchema], { nullable: true })
  businessRoles?: BusinessRoleSchema[];
}