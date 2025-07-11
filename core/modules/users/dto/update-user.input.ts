import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ImageCode } from '../../../common/transforms';

@InputType()
export class UpdateUserInput {
    @Field(() => Number)
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    id: number;

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