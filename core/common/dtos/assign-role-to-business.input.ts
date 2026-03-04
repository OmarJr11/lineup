import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

/**
 * Input for assigning a role to a business.
 */
@InputType()
export class AssignRoleToBusinessInput {
    @Field(() => Int)
    @IsNotEmpty()
    @Type(() => Number)
    @IsInt()
    idBusiness: number;

    @Field(() => Int)
    @IsNotEmpty()
    @Type(() => Number)
    @IsInt()
    idRole: number;
}
