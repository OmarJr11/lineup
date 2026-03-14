import { Product, ProductRating, ProductReaction, ProductSku } from '../../entities';
import { ProductRatingSchema, ProductSchema, ProductReactionSchema, ProductSkuSchema } from '../../schemas';

/**
 * Maps ProductSku entity to ProductSkuSchema.
 * variationOptions (VariationOptions) is compatible with the JSON scalar in the schema.
 */
function toProductSkuSchema(sku: ProductSku): ProductSkuSchema {
    return {
        ...sku,
        variationOptions: sku.variationOptions ?? {},
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