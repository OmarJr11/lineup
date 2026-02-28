import { Field, Int, ObjectType } from '@nestjs/graphql';
import { BusinessSchema } from './business.schema';
import { CatalogSchema } from './catalog.schema';

/**
 * GraphQL schema for CatalogSearchIndex entity.
 * Used for full-text search over catalogs with denormalized metrics.
 */
@ObjectType()
export class CatalogSearchIndexSchema {
    @Field(() => Int)
    id: number;

    @Field(() => Int)
    idCatalog: number;

    @Field(() => CatalogSchema, { nullable: true })
    catalog?: CatalogSchema;

    @Field(() => Int)
    idBusiness: number;

    @Field(() => BusinessSchema, { nullable: true })
    business?: BusinessSchema;

    @Field({ nullable: true, description: 'Full-text search vector (internal use)' })
    searchVector?: string;

    @Field(() => Int)
    visits: number;

    @Field(() => Int)
    productLikesTotal: number;

    @Field(() => Int)
    productVisitsTotal: number;
}
