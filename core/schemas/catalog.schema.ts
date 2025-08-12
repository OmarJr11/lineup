import { StatusEnum } from '../common/enums';
import { BusinessSchema, ProductSchema } from '.';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CatalogSchema{
    @Field(() => Int)
    id: number;

    @Field()
    title: string;

    @Field(() => StatusEnum)
    status: StatusEnum;

    @Field(() => Int)
    idCreationBusiness: number;

    @Field(() => BusinessSchema, { nullable: true })
    creationBusiness?: BusinessSchema;

    @Field(() => BusinessSchema, { nullable: true })
    modificationBusiness?: BusinessSchema;

    @Field(() => [ProductSchema], { nullable: true })
    products?: ProductSchema[];
}
