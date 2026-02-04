import { Field, Int, ObjectType } from '@nestjs/graphql';
import { StatusEnum } from '../common/enums';
import { BusinessSchema, UserSchema } from '.';

@ObjectType()
export class BusinessFollowerSchema {
    @Field(() => Int)
    id: number;

    @Field(() => Int)
    idBusiness: number;

    @Field(() => BusinessSchema, { nullable: true })
    business?: BusinessSchema;

    @Field(() => Int)
    idCreationUser: number;

    @Field(() => UserSchema, { nullable: true })
    creationUser?: UserSchema;

    @Field(() => StatusEnum)
    status: StatusEnum;
}
