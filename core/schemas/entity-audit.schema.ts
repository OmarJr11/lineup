import GraphQLJSON from 'graphql-type-json';
import { AuditOperationEnum } from '../common/enums';
import { EntityAuditValues } from '../common/types';
import { BusinessSchema, UserSchema } from '.';
import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * GraphQL schema for EntityAudit (generic audit).
 */
@ObjectType()
export class EntityAuditSchema {
    @Field(() => Int)
    id: number;

    @Field(() => String)
    entityName: string;

    @Field(() => Int)
    entityId: number;

    @Field(() => AuditOperationEnum)
    operation: AuditOperationEnum;

    @Field(() => GraphQLJSON, {
        nullable: true,
        description: 'Values before change',
    })
    oldValues?: EntityAuditValues;

    @Field(() => GraphQLJSON, {
        nullable: true,
        description: 'Values after change',
    })
    newValues?: EntityAuditValues;

    @Field(() => Int, { nullable: true })
    idCreationBusiness?: number | null;

    @Field(() => BusinessSchema, { nullable: true })
    creationBusiness?: BusinessSchema | null;

    @Field(() => Int, { nullable: true })
    idCreationUser?: number | null;

    @Field(() => UserSchema, { nullable: true })
    creationUser?: UserSchema | null;

    @Field()
    creationDate: Date;
}
