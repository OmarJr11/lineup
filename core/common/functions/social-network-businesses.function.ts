import { SocialNetworkBusiness } from '../../entities';
import { SocialNetworkBusinessSchema } from '../../schemas';

export function toSocialNetworkBusinessSchema(
    socialNetworkBusiness: SocialNetworkBusiness
): SocialNetworkBusinessSchema {
    return socialNetworkBusiness as SocialNetworkBusinessSchema;
}
