import { Field, Int, ObjectType } from '@nestjs/graphql';
import { StatusEnum } from '../common/enums';
import { ProductSchema, UserSchema } from '.';

/**
 * GraphQL ObjectType representing a product rating submitted by a user.
 */
@ObjectType()
export class ProductRatingSchema {
    @Field(() => Int)
    id: number;

    @Field(() => Int)
    idProduct: number;

    @Field(() => ProductSchema, { nullable: true })
    product?: ProductSchema;

    @Field(() => Int)
    idCreationUser: number;

    @Field(() => UserSchema, { nullable: true })
    creationUser?: UserSchema;

    /** Star rating from 1 to 5. */
    @Field(() => Int)
    stars: number;

    /** Optional written comment accompanying the rating. */
    @Field({ nullable: true })
    comment?: string;

    @Field(() => StatusEnum)
    status: StatusEnum;
}
