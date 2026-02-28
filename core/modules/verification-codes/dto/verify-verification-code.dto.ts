import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString, Length } from "class-validator";

@InputType()
export class VerifyVerificationCodeDto {
  @Field()
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  code: string;
}