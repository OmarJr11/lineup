import type { Tag } from '../../entities';
import type { TagSchema } from '../../schemas';

/**
 * Maps Tag entity to TagSchema.
 * @param {Tag} tag - The tag entity.
 * @returns {TagSchema} The tag schema.
 */
export function toTagSchema(tag: Tag): TagSchema {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    idCreationBusiness: tag.idCreationBusiness,
    creationBusiness: tag.creationBusiness as TagSchema['creationBusiness'],
  };
}
