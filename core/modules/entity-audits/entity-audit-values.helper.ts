import type { EntityAuditValues, JsonObject } from '../../common/types';

/** Keys to exclude from audit snapshots (sensitive or redundant). */
const EXCLUDED_KEYS = new Set([
  'password',
  'creationIp',
  'modificationIp',
  'creationCoordinate',
  'modificationCoordinate',
]);

/**
 * Extracts audit-relevant values from an entity.
 * Excludes relations, functions, and sensitive fields.
 * @param {object} entity - The entity to serialize.
 * @returns {EntityAuditValues} Plain object suitable for audit storage.
 */
export function toEntityAuditValues(entity: object): EntityAuditValues {
  if (entity == null) return null;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entity)) {
    if (EXCLUDED_KEYS.has(key)) continue;
    if (typeof value === 'function') continue;
    if (value === undefined) continue;
    if (Array.isArray(value)) continue;
    if (
      value != null &&
      typeof value === 'object' &&
      !(value instanceof Date)
    ) {
      if (
        'id' in value &&
        typeof (value as { id?: unknown }).id !== 'undefined'
      )
        continue;
    }
    if (value instanceof Date) {
      result[key] = value.toISOString();
    } else {
      result[key] = value;
    }
  }
  return Object.keys(result).length > 0 ? (result as JsonObject) : null;
}
