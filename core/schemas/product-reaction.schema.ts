import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ReactionTypeEnum, StatusEnum } from '../common/enums';
import { ProductSchema, UserSchema } from '.';

@ObjectType()
export class ProductReactionSchema {
    @Field(() => Int)
    id: number;

    @Field(() => Int)
    idProduct: number;

    @Field(() => ProductSchema, { nullable: true })
    product?: ProductSchema;

    @Field(() => ReactionTypeEnum)
    type: ReactionTypeEnum;

    @Field(() => Int)
    idCreationUser: number;

    @Field(() => UserSchema, { nullable: true })
    creationUser?: UserSchema;

    @Field(() => StatusEnum)
    status: StatusEnum;
}
