import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ProductSchema, TagSchema } from '.';

/**
 * GraphQL schema for ProductTag junction entity.
 * Maps the many-to-many relationship between Product and Tag.
 */
@ObjectType()
export class ProductTagSchema {
    @Field(() => Int)
    idProduct: number;

    @Field(() => Int)
    idTag: number;

    @Field(() => ProductSchema, { nullable: true })
    product?: ProductSchema;

    @Field(() => TagSchema, { nullable: true })
    tag?: TagSchema;
}
