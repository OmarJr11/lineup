import GraphQLJSON from 'graphql-type-json';
import { StatusEnum } from '../common/enums';
import { BusinessSchema, ProductSchema } from '.';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

/**
 * GraphQL schema for ProductSku.
 * variationOptions uses JSON scalar to expose Record<string, string> (e.g. {"Color":"Amarillo","Talla":"M"}).
 */
@ObjectType()
export class ProductSkuSchema {
    @Field(() => Int)
    id: number;

    @Field(() => Int)
    idProduct: number;

    @Field(() => ProductSchema, { nullable: true })
    product?: ProductSchema;

    @Field()
    skuCode: string;

    /**
     * Variation options as key-value object, e.g. {"Color":"Amarillo","Talla":"M"}.
     */
    @Field(() => GraphQLJSON, { description: 'Variation options as key-value object' })
    variationOptions: Record<string, string>;

    @Field(() => Int)
    quantity: number;

    @Field(() => Float, { nullable: true })
    price?: number;

    @Field(() => StatusEnum)
    status: StatusEnum;

    @Field(() => Int)
    idCreationBusiness: number;

    @Field(() => BusinessSchema, { nullable: true })
    business?: BusinessSchema;

    @Field(() => BusinessSchema, { nullable: true })
    modificationBusiness?: BusinessSchema;
}
