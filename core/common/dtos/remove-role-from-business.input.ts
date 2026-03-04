import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

/**
 * Input for removing a role from a business.
 */
@InputType()
export class RemoveRoleFromBusinessInput {
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
