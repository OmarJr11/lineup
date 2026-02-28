import { Field, Int, ObjectType } from '@nestjs/graphql';
import { BusinessSchema } from './business.schema';

/**
 * GraphQL schema for BusinessSearchIndex entity.
 * Used for full-text search over businesses with denormalized metrics.
 */
@ObjectType()
export class BusinessSearchIndexSchema {
    @Field(() => Int)
    id: number;

    @Field(() => Int)
    idBusiness: number;

    @Field(() => BusinessSchema, { nullable: true })
    business?: BusinessSchema;

    @Field({ nullable: true, description: 'Full-text search vector (internal use)' })
    searchVector?: string;

    @Field(() => Int)
    visits: number;

    @Field(() => Int)
    followers: number;

    @Field(() => Int)
    catalogVisitsTotal: number;

    @Field(() => Int)
    productLikesTotal: number;

    @Field(() => Int)
    productVisitsTotal: number;
}
