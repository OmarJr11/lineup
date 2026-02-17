import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * Response schema for the recordVisit mutation.
 */
@ObjectType()
export class RecordVisitResponseSchema {
    @Field(() => Boolean)
    success: boolean;

    @Field(() => Int, { nullable: true })
    visits?: number;
}
