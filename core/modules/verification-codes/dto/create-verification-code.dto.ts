import {
  IsEmpty,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { VerificationCodeChannelEnum } from '../../../common/enums';

/**
 * Data required to create a new verification code for an authenticated user or business.
 */
@InputType()
export class CreateVerificationCodeDto {
  @Field(() => VerificationCodeChannelEnum)
  @IsNotEmpty()
  @IsEnum(VerificationCodeChannelEnum)
  channel: VerificationCodeChannelEnum;

  @IsEmpty()
  idUser?: number;

  @IsEmpty()
  idBusiness?: number;

  @IsEmpty()
  destination?: string;
}
