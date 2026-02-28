import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, Length, MinLength } from 'class-validator';

/**
 * Input DTO for changing password.
 * Requires current password, new password, and a one-time verification code
 * previously sent to the owner's registered destination.
 */
@InputType()
export class ChangePasswordInput {
  @Field({ description: 'Current password for verification' })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @Field({ description: 'New password (min 8 characters, recommended: mixed case, numbers, symbols)' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;
}
