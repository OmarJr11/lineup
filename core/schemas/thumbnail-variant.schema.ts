import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * GraphQL shape for one thumbnail size (url and dimensions).
 */
@ObjectType()
export class ThumbnailVariantSchema {
  @Field()
  url: string;

  @Field(() => Int)
  width: number;

  @Field(() => Int)
  height: number;
}
