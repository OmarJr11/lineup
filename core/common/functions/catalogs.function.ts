import { Catalog } from '../../entities';
import { CatalogSchema } from '../../schemas';

export function toCatalogSchema(catalog: Catalog): CatalogSchema {
    return catalog as CatalogSchema;
}