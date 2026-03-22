import { registerEnumType } from '@nestjs/graphql';

/**
 * Names of entities that support audit history.
 */
export enum AuditableEntityNameEnum {
  Product = 'Product',
  ProductSku = 'ProductSku',
  Discount = 'Discount',
  Business = 'Business',
  Catalog = 'Catalog',
  Location = 'Location',
  ProductVariation = 'ProductVariation',
  ProductFile = 'ProductFile',
  Role = 'Role',
  Permission = 'Permission',
  User = 'User',
  SocialNetworkBusiness = 'SocialNetworkBusiness',
  DiscountProduct = 'DiscountProduct',
}

/** Array of all auditable entity names. */
export const AUDITABLE_ENTITY_NAMES = Object.values(AuditableEntityNameEnum);

export type AuditableEntityName = AuditableEntityNameEnum;

registerEnumType(AuditableEntityNameEnum, { name: 'AuditableEntityNameEnum' });
