import type { BusinessHour } from '../../entities';
import type { BusinessHourSchema } from '../../schemas';

/**
 * Casts a business hour entity to GraphQL schema.
 * @param {BusinessHour} businessHour - Source entity.
 * @returns {BusinessHourSchema} GraphQL schema object.
 */
export function toBusinessHourSchema(
  businessHour: BusinessHour,
): BusinessHourSchema {
  return businessHour as BusinessHourSchema;
}
