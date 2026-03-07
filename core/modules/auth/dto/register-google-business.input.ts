import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Input for registering a new business with Google OAuth token.
 * The token is the ID token provided by Google Sign-In on the frontend.
 * New businesses are created with the BUSINESS role.
 */
@InputType()
export class RegisterGoogleBusinessInput {
  @Field({ description: 'Google ID token from the frontend' })
  @IsNotEmpty()
  @IsString()
  token: string;
}
