import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

/**
 * Input DTO for verifying an email verification code.
 */
@InputType()
export class VerifyCodeInput {
  /** Email address associated with the verification code */
  @Field()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  /** 6-digit numeric verification code sent to the email */
  @Field()
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  code: string;
}
