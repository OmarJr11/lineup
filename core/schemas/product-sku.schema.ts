import { StatusEnum } from '../common/enums';
import { BusinessSchema, ProductSchema } from '.';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

/**
 * GraphQL schema for ProductSku.
 * variationOptions is exposed as a JSON-like structure; clients receive key-value pairs.
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
     * Variation options as JSON string, e.g. '{"Color":"Amarillo","Talla":"M"}'.
     * Parse on client to get Record<string, string>.
     */
    @Field({ description: 'JSON string of variation options' })
    variationOptions: string;

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
