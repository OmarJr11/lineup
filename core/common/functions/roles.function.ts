import type { Role } from '../../entities';
import type { RoleSchema } from '../../schemas';

export function toRoleSchema(role: Role): RoleSchema {
  return {
    ...role,
  } as RoleSchema;
}
