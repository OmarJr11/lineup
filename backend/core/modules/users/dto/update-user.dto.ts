import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ImageCode } from '../../../common/transforms';

@InputType()
export class UpdateUserDto {
    @Field({ nullable: true })
    @IsOptional()
    @MaxLength(50)
    @IsString()
    username?: string;

    @Field({ nullable: true })
    @IsOptional()
    @MaxLength(255)
    @IsString()
    firstName?: string;

    @Field({ nullable: true })
    @IsOptional()
    @MaxLength(255)
    @IsString()
    lastName?: string;

    @Field({ nullable: true })
    @IsOptional()
    @MaxLength(50)
    @Transform(ImageCode)
    imgCode?: string;
}