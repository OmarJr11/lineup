import { InputType, Field } from '@nestjs/graphql';
import { IsEmpty, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { RolesCodesEnum } from '../../../common/enums';

@InputType()
export class CreateBusinessInput {
  @Field()
  @IsNotEmpty()
  @MaxLength(50)
  @IsString()
  email: string;

  @Field()
  @IsNotEmpty()
  @MaxLength(100)
  @IsString()
  name: string;

  @Field()
  @IsNotEmpty()
  @MaxLength(200)
  @IsString()
  password: string;

  @Field(() => RolesCodesEnum)
  @IsNotEmpty()
  @IsEnum(RolesCodesEnum)
  role: RolesCodesEnum;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(255)
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(30)
  @IsString()
  telephone?: string;

  @Field()
  @IsNotEmpty()
  @MaxLength(50)
  @IsString()
  imageCode: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @Field({ nullable: true })
  @IsEmpty()
  path?: string;

  @Field({ nullable: true })
  @IsEmpty()
  emailValidated?: boolean;

  @Field({ nullable: true })
  @IsEmpty()
  provider?: string;
}