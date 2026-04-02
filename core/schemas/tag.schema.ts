import { Field, Int, ObjectType } from '@nestjs/graphql';
import { BusinessSchema } from '.';

@ObjectType()
export class TagSchema {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field(() => Int)
  idCreationBusiness: number;

  @Field(() => BusinessSchema, { nullable: true })
  creationBusiness?: BusinessSchema;
}
