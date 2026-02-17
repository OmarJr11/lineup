import { StatusEnum } from '../common/enums';
import { BusinessSchema, FileSchema, ProductSchema } from '.';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CatalogSchema{
    @Field(() => Int)
    id: number;

    @Field()
    title: string;

    @Field({ nullable: true })
    imageCode?: string;

    @Field()
    path: string;

    @Field(() => StatusEnum)
    status: StatusEnum;

    @Field(() => Int)
    idCreationBusiness: number;

    @Field(() => Int)
    visits: number;

    @Field(() => [String], { nullable: true })
    tags?: string[];

    @Field(() => BusinessSchema, { nullable: true })
    business?: BusinessSchema;

    @Field(() => BusinessSchema, { nullable: true })
    modificationBusiness?: BusinessSchema;

    @Field(() => [ProductSchema], { nullable: true })
    products?: ProductSchema[];

    @Field(() => FileSchema, { nullable: true })
    image?: FileSchema;
}
