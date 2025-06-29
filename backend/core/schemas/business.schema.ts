import { ObjectType, Field, Int } from '@nestjs/graphql';
import { StatusEnum } from '../common/enums/status.enum';
import { FileSchema } from './file.schema';
import { UserSchema } from './user.schema';

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

  @Field(() => Int)
  idCreationUser: number;

  @Field(() => UserSchema, { nullable: true })
  creationUser?: UserSchema;

  @Field(() => UserSchema, { nullable: true })
  modificationUser?: UserSchema;
}