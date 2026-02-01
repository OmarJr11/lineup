import { StatusEnum } from '../common/enums';
import { BusinessSchema, ProductSchema } from '.';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProductVariationSchema {
    @Field(() => Int)
    id: number;

    @Field()
    title: string;

    @Field(() => [String])
    options: string[];

    @Field(() => Int)
    idProduct: number;

    @Field(() => ProductSchema, { nullable: true })
    product?: ProductSchema;

    @Field(() => StatusEnum)
    status: StatusEnum;

    @Field(() => Int)
    idCreationBusiness: number;

    @Field(() => BusinessSchema, { nullable: true })
    business?: BusinessSchema;

    @Field(() => BusinessSchema, { nullable: true })
    modificationBusiness?: BusinessSchema;
}
