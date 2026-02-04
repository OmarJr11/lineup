import { StatusEnum } from '../common/enums';
import { BusinessSchema, CatalogSchema, ProductFileSchema, ProductReactionSchema, ProductVariationSchema } from '.';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProductSchema{
    @Field(() => Int)
    id: number;

    @Field()
    title: string;

    @Field()
    subtitle: string;

    @Field()
    description: string;

    @Field(() => Float, { nullable: true })
    price?: number;

    @Field(() => Int)
    likes: number;

    @Field(() => Int)
    idCatalog: number;

    @Field(() => CatalogSchema, { nullable: true })
    catalog?: CatalogSchema;

    @Field(() => [String])
    tags: string[];

    @Field(() => StatusEnum)
    status: StatusEnum;

    @Field(() => Int)
    idCreationBusiness: number;

    @Field(() => BusinessSchema, { nullable: true })
    business?: BusinessSchema;

    @Field(() => BusinessSchema, { nullable: true })
    modificationBusiness?: BusinessSchema;

    @Field(() => [ProductFileSchema], { nullable: true })
    productFiles?: ProductFileSchema[];

    @Field(() => [ProductVariationSchema], { nullable: true })
    variations?: ProductVariationSchema[];

    @Field(() => [ProductReactionSchema], { nullable: true })
    reactions?: ProductReactionSchema[];
}
