import { ObjectType, Field, Float, Int } from '@nestjs/graphql';
import { StatusEnum } from '../common/enums';
import { BusinessSchema } from './business.schema';

@ObjectType()
export class LocationSchema {
    @Field(() => Int)
    id: number;

    @Field(() => Float)
    lat: number;

    @Field(() => Float)
    lng: number;

    @Field()
    address: string;

    @Field()
    formattedAddress: string;

    @Field(() => StatusEnum)
    status: StatusEnum;

    @Field(() => Int)
    idCreationBusiness: number;

    @Field(() => BusinessSchema)
    business?: BusinessSchema;

    @Field(() => BusinessSchema)
    modificationBusiness?: BusinessSchema;
}
