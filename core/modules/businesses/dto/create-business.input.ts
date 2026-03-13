import { InputType, Field } from '@nestjs/graphql';
import { IsBoolean, IsEmpty, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
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

    @Field({ nullable: true, description: 'Whether the business operates online' })
    @IsOptional()
    @IsBoolean()
    isOnline?: boolean;

    @IsEmpty()
    path?: string;

    @IsEmpty()
    emailValidated?: boolean;

    @IsEmpty()
    provider?: string;
}