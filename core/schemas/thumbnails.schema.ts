import { Field, ObjectType } from '@nestjs/graphql';
import { ThumbnailVariantSchema } from './thumbnail-variant.schema';

/**
 * GraphQL shape for xs / sm / md thumbnails stored on a file.
 */
@ObjectType()
export class ThumbnailsSchema {
  @Field(() => ThumbnailVariantSchema)
  xs: ThumbnailVariantSchema;

  @Field(() => ThumbnailVariantSchema)
  sm: ThumbnailVariantSchema;

  @Field(() => ThumbnailVariantSchema)
  md: ThumbnailVariantSchema;
}
