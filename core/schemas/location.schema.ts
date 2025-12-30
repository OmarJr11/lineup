import { ObjectType, Field, Int } from '@nestjs/graphql';
import { StatusEnum } from '../common/enums';
import { BusinessSchema } from './business.schema';

@ObjectType()
export class LocationSchema {
    @Field(() => Int)
    id: number;

    @Field()
    address: string;

    @Field(() => String, { nullable: true })
    addressComponents?: string;

    @Field(() => String)
    googleMapsUrl?: string;

    @Field(() => StatusEnum)
    status: StatusEnum;

    @Field(() => Int)
    idCreationBusiness: number;

    @Field(() => BusinessSchema)
    business?: BusinessSchema;

    @Field(() => BusinessSchema)
    modificationBusiness?: BusinessSchema;
}
