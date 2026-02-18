import { Field, Int, ObjectType } from '@nestjs/graphql';
import { BusinessSchema } from './business.schema';
import { CatalogSchema } from './catalog.schema';
import { ProductSchema } from './product.schema';

/**
 * GraphQL schema for ProductSearchIndex entity.
 * Used for full-text search over products with denormalized metrics.
 */
@ObjectType()
export class ProductSearchIndexSchema {
    @Field(() => Int)
    id: number;

    @Field(() => Int)
    idProduct: number;

    @Field(() => ProductSchema, { nullable: true })
    product?: ProductSchema;

    @Field(() => Int)
    idBusiness: number;

    @Field(() => BusinessSchema, { nullable: true })
    business?: BusinessSchema;

    @Field(() => Int)
    idCatalog: number;

    @Field(() => CatalogSchema, { nullable: true })
    catalog?: CatalogSchema;

    @Field({ nullable: true, description: 'Full-text search vector (internal use)' })
    searchVector?: string;

    @Field(() => Int)
    likes: number;

    @Field(() => Int)
    visits: number;
}
