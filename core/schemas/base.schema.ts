import { ObjectType, Field } from '@nestjs/graphql';
import { CoordinateSchema } from './coordinates.schema';

@ObjectType()
export class BaseSchema {
  @Field({ nullable: true })
  creationDate?: Date;

  @Field({ nullable: true })
  modificationDate?: Date;

  @Field({ nullable: true })
  creationIp?: string;

  @Field({ nullable: true })
  modificationIp?: string;

  @Field(() => CoordinateSchema, { nullable: true })
  creationCoordinate?: CoordinateSchema;

  @Field(() => CoordinateSchema, { nullable: true })
  modificationCoordinate?: CoordinateSchema;
}