import { ObjectType, Field, Int } from '@nestjs/graphql';
import { StatusEnum } from '../common/enums';
import { BusinessSchema, SocialNetworkSchema } from '.';

@ObjectType()
export class SocialNetworkBusinessSchema {
    @Field(() => Int)
    id: number;

    @Field(() => Int)
    idSocialNetwork: number;

    @Field({ nullable: true })
    url?: string;

    @Field({ nullable: true })
    phone?: string;

    @Field(() => StatusEnum)
    status: StatusEnum;

    @Field(() => Int)
    idCreationBusiness: number;

    @Field(() => BusinessSchema, { nullable: true })
    business?: BusinessSchema;

    @Field(() => SocialNetworkSchema, { nullable: true })
    socialNetwork?: SocialNetworkSchema;

    @Field(() => BusinessSchema, { nullable: true })
    creationBusiness?: BusinessSchema;

    @Field(() => BusinessSchema, { nullable: true })
    modificationBusiness?: BusinessSchema;
}
