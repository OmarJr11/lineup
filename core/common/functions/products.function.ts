import { Product, ProductRating, ProductReaction } from '../../entities';
import { ProductRatingSchema, ProductSchema, ProductReactionSchema } from '../../schemas';

export function toProductSchema(product: Product): ProductSchema {
    return product as ProductSchema;
}

export function toProductReactionSchema(productReaction: ProductReaction): ProductReactionSchema {
    return productReaction as ProductReactionSchema;
}

export function toProductRatingSchema(productRating: ProductRating): ProductRatingSchema {
    return productRating as ProductRatingSchema;
}