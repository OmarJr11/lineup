import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UploadFileDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(50)
    directory: string;
}
