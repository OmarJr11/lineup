import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Input DTO for requesting an email verification code.
 */
@InputType()
export class SendVerificationCodeInput {
  /** Email address to which the verification code will be sent */
  @Field()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;
}
