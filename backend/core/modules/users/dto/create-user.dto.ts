import { Transform } from 'class-transformer';
import {
    IsEmail,
    IsEmpty,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';
import { ImageCode, toLowerCase } from '../../../common/transforms';
import { RolesCodesEnum } from '../../../common/enums';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateUserDto {
    @Field({ nullable: true })
    @IsOptional()
    @MaxLength(50)
    @IsString()
    username?: string;

    @Field()
    @IsNotEmpty()
    @MaxLength(255)
    @IsString()
    firstName: string;

    @Field()
    @IsNotEmpty()
    @MaxLength(255)
    @IsString()
    lastName: string;

    @Field()
    @IsNotEmpty()
    @MaxLength(200)
    @IsString()
    password: string;

    @Field()
    @IsNotEmpty()
    @MaxLength(50)
    @IsEmail()
    @Transform(toLowerCase)
    email: string;

    @Field(() => RolesCodesEnum)
    @IsNotEmpty()
    @IsString()
    @IsEnum(RolesCodesEnum)
    role: RolesCodesEnum;

    @Field({ nullable: true })
    @IsOptional()
    @MaxLength(50)
    @Transform(ImageCode)
    imgCode?: string;

    @Field({ nullable: true })
    @IsOptional()
    @MaxLength(50)
    telephone?: string;

    @Field({ nullable: true })
    @IsEmpty()
    emailValidated?: boolean;

    @Field({ nullable: true })
    @IsEmpty()
    provider?: string;
}
