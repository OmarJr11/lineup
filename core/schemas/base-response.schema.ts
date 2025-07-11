import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class BaseResponse {
  @Field()
  status: boolean;

  @Field()
  message: string;

  @Field(() => Int)
  code: number;
}