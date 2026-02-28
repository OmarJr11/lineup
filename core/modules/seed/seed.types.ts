/**
 * Internal type for catalog seed data (no GraphQL input).
 */
export interface ISeedCatalogData {
    title: string;
    path: string;
    idCreationBusiness: number;
    visits?: number;
    tags?: string[];
    imgCode?: string;
}

/**
 * Internal type for product image seed data.
 */
export interface ISeedProductImage {
    imageCode: string;
    order: number;
}

/**
 * Internal type for product variation seed data.
 */
export interface ISeedProductVariation {
    title: string;
    options: string[];
}

/**
 * Internal type for product seed data (no GraphQL input).
 */
export interface ISeedProductData {
    catalogPath: string;
    title: string;
    subtitle: string;
    description: string;
    price?: number;
    images: ISeedProductImage[];
    tags: string[];
    variations?: ISeedProductVariation[];
}
