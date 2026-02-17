import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, Min } from 'class-validator';
import { VisitTypeEnum } from '../../../../../core/common/enums';

/**
 * Input DTO for the recordVisit mutation.
 */
@InputType()
export class RecordVisitInput {
    @Field(() => VisitTypeEnum, {
        description: 'Type of entity being visited (BUSINESS, PRODUCT, or CATALOG)'
    })
    @IsEnum(VisitTypeEnum)
    type: VisitTypeEnum;

    @Field(() => Int, { description: 'ID of the business, product, or catalog' })
    @IsInt()
    @Min(1)
    id: number;
}
