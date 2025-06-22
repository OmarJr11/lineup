import { ObjectType, Field, Int } from "@nestjs/graphql";
import { Type } from '@nestjs/common';
import { BaseResponse } from "./base-response.schema";

export function ResponseSchema<TItem>(TClass: Type<TItem>, isArray = false) {
  @ObjectType()
  abstract class ResponseClass extends BaseResponse {
    @Field(() => (isArray ? [TClass] : TClass), { nullable: true })
    data?: TItem | TItem[];
  }
  return ResponseClass;
}