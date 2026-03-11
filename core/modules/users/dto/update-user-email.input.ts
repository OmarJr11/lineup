import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { toLowerCase } from '../../../common/transforms';

/**
 * DTO for updating only the user's email.
 */
@InputType()
export class UpdateUserEmailInput {
  @Field()
  @IsNotEmpty()
  @MaxLength(50)
  @IsEmail()
  @Transform(toLowerCase)
  email: string;
}
