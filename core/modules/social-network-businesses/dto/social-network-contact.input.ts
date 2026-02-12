import { Field, InputType } from '@nestjs/graphql';
import {
    IsNotEmpty,
    IsPhoneNumber,
    IsString,
    IsUrl,
    Validate,
    ValidateIf,
} from 'class-validator';
import { UrlOrPhoneExclusiveValidator } from '../../../common/validators/url-or-phone-exclusive.validator';

/**
 * Input type for social network contact (url or phone).
 * Exactly one of url or phone must be provided, not both.
 */
@InputType()
export class SocialNetworkContactInput {
    @Field({ nullable: true })
    @Validate(UrlOrPhoneExclusiveValidator)
    @ValidateIf((o) => !o.phone || o.url)
    @IsNotEmpty({ message: 'url or phone must be provided' })
    @IsString()
    @IsUrl()
    url?: string;

    @Field({ nullable: true })
    @Validate(UrlOrPhoneExclusiveValidator)
    @ValidateIf((o) => !o.url || o.phone)
    @IsNotEmpty({ message: 'url or phone must be provided' })
    @IsString()
    @IsPhoneNumber()
    phone?: string;
}
