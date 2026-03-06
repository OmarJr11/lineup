import { DiscountTypeEnum } from '../common/enums';
import { BusinessSchema, CatalogSchema, CurrencySchema } from '.';
import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

/**
 * GraphQL schema for Discount.
 */
@ObjectType()
export class DiscountSchema {
    @Field(() => Int)
    id: number;

    @Field(() => DiscountTypeEnum)
    discountType: DiscountTypeEnum;

    @Field(() => Float)
    value: number;

    @Field(() => Int, { nullable: true })
    idCurrency?: number;

    @Field(() => CurrencySchema, { nullable: true })
    currency?: CurrencySchema;

    @Field()
    startDate: Date;

    @Field()
    endDate: Date;

    @Field(() => Int, { nullable: true })
    idBusiness?: number;

    @Field(() => BusinessSchema, { nullable: true })
    business?: BusinessSchema;

    @Field(() => Int, { nullable: true })
    idCatalog?: number;

    @Field(() => CatalogSchema, { nullable: true })
    catalog?: CatalogSchema;

    @Field(() => Int)
    idCreationBusiness: number;

    @Field(() => BusinessSchema, { nullable: true })
    creationBusiness?: BusinessSchema;

    @Field(() => BusinessSchema, { nullable: true })
    modificationBusiness?: BusinessSchema;

    @Field({ nullable: true })
    creationDate?: Date;

    @Field({ nullable: true })
    modificationDate?: Date;
}
