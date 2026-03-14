import { Field, ObjectType } from '@nestjs/graphql';
import { ProductSchema } from './product.schema';

/**
 * GraphQL schema for a dynamic product collection.
 * Collections are computed on each request and not persisted.
 */
@ObjectType()
export class ProductCollectionSchema {
    @Field(() => String, { description: 'Unique identifier for the collection type' })
    id: string;

    @Field(() => String, { description: 'Display title for the collection' })
    title: string;

    @Field(() => [ProductSchema], { description: 'Products in the collection' })
    products: ProductSchema[];
}
