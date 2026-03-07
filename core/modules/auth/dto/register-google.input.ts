import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { RolesCodesEnum } from '../../../common/enums';

/**
 * Input for registering a new user with Google OAuth token.
 * The token is the ID token provided by Google Sign-In on the frontend.
 */
@InputType()
export class RegisterGoogleInput {
  @Field({ description: 'Google ID token from the frontend' })
  @IsNotEmpty()
  @IsString()
  token: string;

  @Field(() => RolesCodesEnum, {
    description: 'Role to assign to the new user',
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(RolesCodesEnum)
  role: RolesCodesEnum;
}
