import { Field, Int, ObjectType } from '@nestjs/graphql';
import { CatalogSchema, UserSchema } from '.';

/**
 * GraphQL ObjectType representing a visit record to a catalog.
 * Supports logged-in users (idCreationUser) or anonymous visits (idCreationUser null).
 */
@ObjectType()
export class CatalogVisitSchema {
    @Field(() => Int)
    id: number;

    @Field(() => Int)
    idCatalog: number;

    @Field(() => CatalogSchema, { nullable: true })
    catalog?: CatalogSchema;

    @Field(() => Int, { nullable: true })
    idCreationUser?: number;

    @Field(() => UserSchema, { nullable: true })
    creationUser?: UserSchema;
}
