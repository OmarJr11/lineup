import { InputType, Field } from '@nestjs/graphql';
import { IsEmpty, IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
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

    @IsEmpty()
    path?: string;

    @IsEmpty()
    emailValidated?: boolean;

    @IsEmpty()
    provider?: string;
}