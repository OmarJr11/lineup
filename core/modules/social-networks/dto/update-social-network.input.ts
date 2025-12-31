import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsNumber, IsString, MaxLength, MinLength, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { SocialMediasEnum } from '../../../common/enums';

@InputType()
export class UpdateSocialNetworkInput {
    @Field()
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    id: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    @IsString()
    name?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsNotEmpty()
    @IsEnum(SocialMediasEnum)
    code?: SocialMediasEnum;

    @Field({ nullable: true })
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    imageCode?: string;
}
