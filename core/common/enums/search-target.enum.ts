import { registerEnumType } from '@nestjs/graphql';

/**
 * Enum for search target: all entities, businesses only, catalogs only, or products only.
 */
export enum SearchTargetEnum {
    ALL = 'ALL',
    BUSINESSES = 'BUSINESSES',
    CATALOGS = 'CATALOGS',
    PRODUCTS = 'PRODUCTS',
}

registerEnumType(SearchTargetEnum, { name: 'SearchTargetEnum' });
