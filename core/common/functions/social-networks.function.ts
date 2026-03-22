import type { SocialNetwork } from '../../entities';
import type { SocialNetworkSchema } from '../../schemas';

export function toSocialNetworkSchema(
  socialNetwork: SocialNetwork,
): SocialNetworkSchema {
  return socialNetwork as SocialNetworkSchema;
}
