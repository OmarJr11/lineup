/**
 * Names of entities that support audit history.
 */
export const AUDITABLE_ENTITY_NAMES = [
    'Product',
    'ProductSku',
    'Discount',
    'Business',
    'Catalog',
    'Location',
    'ProductVariation',
    'ProductFile',
    'Role',
    'Permission',
    'User',
    'SocialNetworkBusiness',
    'DiscountProduct',
] as const;

export type AuditableEntityName = (typeof AUDITABLE_ENTITY_NAMES)[number];
