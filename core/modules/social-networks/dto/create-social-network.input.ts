import { Field, InputType } from '@nestjs/graphql';
import {
    IsEnum,
    IsNotEmpty,
    IsString,
    MaxLength,
    MinLength
} from 'class-validator';
import { SocialMediasEnum } from '../../../common/enums';

@InputType()
export class CreateSocialNetworkInput {
  @Field()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @IsString()
  name: string;

  @Field()
  @IsNotEmpty()
  @IsEnum(SocialMediasEnum)
  code: SocialMediasEnum;

  @Field()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  imageCode: string;
}
