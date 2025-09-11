import { Product } from '../../entities';
import { ProductSchema } from '../../schemas';

export function toProductSchema(product: Product): ProductSchema {
    return product as ProductSchema;
}