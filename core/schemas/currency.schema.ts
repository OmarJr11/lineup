import { Field, Int, ObjectType } from '@nestjs/graphql';
import { StatusEnum } from '../common/enums';
import { UserSchema } from './';

@ObjectType()
export class CurrencySchema {
    @Field(() => Int)
    id: number;

    @Field()
    name: string;

    @Field()
    code: string;

    @Field(() => StatusEnum)
    status: StatusEnum;

    @Field(() => Int)
    idCreationUser: number;

    @Field(() => UserSchema, { nullable: true })
    creationUser?: UserSchema;
}
