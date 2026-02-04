import { Product, ProductReaction } from '../../entities';
import { ProductSchema, ProductReactionSchema } from '../../schemas';

export function toProductSchema(product: Product): ProductSchema {
    return product as ProductSchema;
}

export function toProductReactionSchema(productReaction: ProductReaction): ProductReactionSchema {
    return productReaction as ProductReactionSchema;
}