import { InputType, Field } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { toLowerCase } from '../../../../core/common/transforms';

@InputType()
export class UserUniqueFieldsDto {
  @Field()
  @IsNotEmpty()
  @MaxLength(50)
  @IsString()
  username: string;

  @Field()
  @IsNotEmpty()
  @MaxLength(50)
  @IsEmail()
  @Transform(toLowerCase)
  email: string;
}