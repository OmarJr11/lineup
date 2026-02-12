import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsEmpty, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { SocialNetworkContactInput } from './social-network-contact.input';

@InputType()
export class CreateSocialNetworkBusinessInput {
    @Field(() => Int)
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    idSocialNetwork: number;

    @Field(() => SocialNetworkContactInput)
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => SocialNetworkContactInput)
    contact: SocialNetworkContactInput;

    @IsEmpty()
    url?: string;

    @IsEmpty()
    phone?: string;
}
