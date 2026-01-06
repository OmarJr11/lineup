import { SocialNetwork } from '../../entities';
import { SocialNetworkSchema } from '../../schemas';

export function toSocialNetworkSchema(
    socialNetwork: SocialNetwork
): SocialNetworkSchema {
    return socialNetwork as SocialNetworkSchema;
}