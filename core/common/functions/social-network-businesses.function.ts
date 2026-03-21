import type { SocialNetworkBusiness } from '../../entities';
import type { SocialNetworkBusinessSchema } from '../../schemas';

export function toSocialNetworkBusinessSchema(
  socialNetworkBusiness: SocialNetworkBusiness,
): SocialNetworkBusinessSchema {
  return socialNetworkBusiness as SocialNetworkBusinessSchema;
}
