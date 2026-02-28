import { registerEnumType } from '@nestjs/graphql';

/** Indicates whether the verification code was sent to an email address or a phone number. */
export enum VerificationCodeChannelEnum {
  EMAIL = 'email',
  PHONE = 'phone',
}

registerEnumType(VerificationCodeChannelEnum, { name: 'VerificationCodeChannelEnum' });
