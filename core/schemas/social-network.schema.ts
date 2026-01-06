import { ObjectType, Field, Int } from '@nestjs/graphql';
import { StatusEnum } from '../common/enums';
import { FileSchema, UserSchema } from '.';

@ObjectType()
export class SocialNetworkSchema {
    @Field(() => Int)
    id: number;

    @Field()
    name: string;

    @Field()
    code: string;

    @Field()
    imageCode: string;

    @Field(() => FileSchema, { nullable: true })
    image?: FileSchema;

    @Field(() => StatusEnum)
    status: StatusEnum;

    @Field(() => Int)
    idCreationUser: number;

    @Field(() => UserSchema)
    creationUser?: UserSchema;

    @Field(() => UserSchema)
    modificationUser?: UserSchema;
}
