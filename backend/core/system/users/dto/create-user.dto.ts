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
import { RolesEnum } from '../../../common/enum';

export class CreateUserDto {
    @IsOptional()
    @MaxLength(50)
    @IsString()
    username?: string;

    @IsNotEmpty()
    @MaxLength(255)
    @IsString()
    firstName: string;

    @IsNotEmpty()
    @MaxLength(255)
    @IsString()
    lastName: string;

    @IsNotEmpty()
    @MaxLength(200)
    @IsString()
    password: string;

    @IsNotEmpty()
    @MaxLength(50)
    @IsEmail()
    @Transform(toLowerCase)
    mail: string;

    @IsNotEmpty()
    @IsEnum(RolesEnum)
    @IsString()
    role: RolesEnum;

    @IsOptional()
    @MaxLength(50)
    @Transform(ImageCode)
    imgCode?: string;

    @IsOptional()
    @MaxLength(50)
    @IsString()
    identityDocument?: string;

    @IsOptional()
    @MaxLength(50)
    telephone?: string;

    @IsOptional()
    @MaxLength(50)
    provider?: string;

    @IsEmpty()
    emailValidated?: boolean;
}
