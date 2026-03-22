/**
 * JSON-serializable value (primitive, object, or array).
 * Ensures audit snapshots only contain data that can be stored in JSONB.
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonValue[];

/**
 * JSON-serializable object.
 */
export type JsonObject = { [key: string]: JsonValue };

/**
 * Snapshot of entity state for audit records.
 * Used in oldValues (before change) and newValues (after change).
 */
export type EntityAuditValues = JsonObject | null;
