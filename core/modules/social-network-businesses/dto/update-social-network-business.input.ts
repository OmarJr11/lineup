import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
    IsEmpty,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPhoneNumber,
    IsString,
    IsUrl,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { SocialNetworkContactInput } from './social-network-contact.input';

@InputType()
export class UpdateSocialNetworkBusinessInput {
    @Field(() => Int)
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    id: number;

    @Field(() => SocialNetworkContactInput)
    @IsOptional()
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => SocialNetworkContactInput)
    contact?: SocialNetworkContactInput;

    @IsEmpty()
    url?: string;

    @IsEmpty()
    phone?: string;
}
