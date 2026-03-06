import { AuditOperationEnum } from '../common/enums';
import { BusinessSchema, ProductSchema } from '.';
import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * GraphQL schema for DiscountProductAudit.
 */
@ObjectType()
export class DiscountProductAuditSchema {
    @Field(() => Int)
    id: number;

    @Field(() => Int)
    idProduct: number;

    @Field(() => ProductSchema, { nullable: true })
    product?: ProductSchema;

    @Field(() => Int, { nullable: true })
    idDiscountOld?: number;

    @Field(() => Int, { nullable: true })
    idDiscountNew?: number;

    @Field(() => AuditOperationEnum)
    operation: AuditOperationEnum;

    @Field(() => Int)
    idCreationBusiness: number;

    @Field(() => BusinessSchema, { nullable: true })
    creationBusiness?: BusinessSchema;

    @Field()
    creationDate: Date;
}
