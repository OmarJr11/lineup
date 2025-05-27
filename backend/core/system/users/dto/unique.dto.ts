import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { toLowerCase } from '../../../../core/common/transforms';

export class UserUniqueFieldsDto {
    @IsNotEmpty()
    @MaxLength(50)
    @IsString()
    username: string;

    @IsNotEmpty()
    @MaxLength(50)
    @IsEmail()
    @Transform(toLowerCase)
    mail: string;
}
