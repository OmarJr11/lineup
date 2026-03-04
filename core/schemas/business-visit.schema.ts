import { Field, Int, ObjectType } from '@nestjs/graphql';
import { BusinessSchema, UserSchema } from '.';

/**
 * GraphQL ObjectType representing a visit record to a business.
 * Supports logged-in users (idCreationUser) or anonymous visits (idCreationUser null).
 */
@ObjectType()
export class BusinessVisitSchema {
    @Field(() => Int)
    id: number;

    @Field(() => Int)
    idBusiness: number;

    @Field(() => BusinessSchema, { nullable: true })
    business?: BusinessSchema;

    @Field(() => Int, { nullable: true })
    idCreationUser?: number;

    @Field(() => UserSchema, { nullable: true })
    creationUser?: UserSchema;
}
