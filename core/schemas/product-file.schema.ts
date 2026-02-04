import { StatusEnum } from '../common/enums';
import { BusinessSchema, FileSchema, ProductSchema } from '.';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProductFileSchema {
    @Field(() => Int)
    id: number;

    @Field()
    imageCode: string;

    @Field(() => FileSchema, { nullable: true })
    file?: FileSchema;

    @Field(() => Int)
    idProduct: number;

    @Field(() => ProductSchema, { nullable: true })
    product?: ProductSchema;

    @Field(() => Int)
    order: number;

    @Field(() => StatusEnum)
    status: StatusEnum;

    @Field(() => Int)
    idCreationBusiness: number;

    @Field(() => BusinessSchema, { nullable: true })
    business?: BusinessSchema;

    @Field(() => BusinessSchema, { nullable: true })
    modificationBusiness?: BusinessSchema;  
}
