import { Product, ProductRating, ProductReaction, ProductSku } from '../../entities';
import { ProductRatingSchema, ProductSchema, ProductReactionSchema, ProductSkuSchema } from '../../schemas';

/**
 * Maps ProductSku entity to ProductSkuSchema (serializes variationOptions to JSON string).
 */
function toProductSkuSchema(sku: ProductSku): ProductSkuSchema {
    return {
        ...sku,
        variationOptions:
            typeof sku.variationOptions === 'string'
                ? sku.variationOptions
                : JSON.stringify(sku.variationOptions ?? {}),
    } as ProductSkuSchema;
}

export function toProductSchema(product: Product): ProductSchema {
    const result = { ...product } as ProductSchema;
    if (product.skus?.length) {
        result.skus = product.skus.map(toProductSkuSchema);
    }
    return result;
}

export function toProductReactionSchema(productReaction: ProductReaction): ProductReactionSchema {
    return productReaction as ProductReactionSchema;
}

export function toProductRatingSchema(productRating: ProductRating): ProductRatingSchema {
    return productRating as ProductRatingSchema;
}