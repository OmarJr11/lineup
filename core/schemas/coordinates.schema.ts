import { ObjectType, Field, Float } from '@nestjs/graphql';

@ObjectType()
export class CoordinateSchema {
  @Field(() => Float, { nullable: true })
  latitude?: number;

  @Field(() => Float, { nullable: true })
  longitude?: number;
}