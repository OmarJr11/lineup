import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Input for login with Google OAuth token.
 * The token is the ID token provided by Google Sign-In on the frontend.
 */
@InputType()
export class LoginGoogleInput {
  @Field({ description: 'Google ID token from the frontend' })
  @IsNotEmpty()
  @IsString()
  token: string;
}
