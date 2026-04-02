import type { Catalog } from '../../entities';
import type { CatalogSchema } from '../../schemas';

export function toCatalogSchema(catalog: Catalog): CatalogSchema {
  return catalog as CatalogSchema;
}
