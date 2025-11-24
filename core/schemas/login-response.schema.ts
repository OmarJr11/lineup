import { ObjectType, Field } from '@nestjs/graphql';
import { BaseResponse } from './base-response.schema';
import { UserSchema } from './user.schema';
import { BusinessSchema } from './business.schema';

@ObjectType()
export class LoginResponse extends BaseResponse {
  @Field(() => UserSchema, { nullable: true })
  user?: UserSchema;

  @Field(() => BusinessSchema, { nullable: true })
  business?: BusinessSchema;
}
