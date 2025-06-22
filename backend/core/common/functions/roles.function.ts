import { Role } from 'core/entities';
import { RoleSchema } from 'core/schemas';

export function toRoleSchema(role: Role): RoleSchema {
    return {
        ...role,
    } as RoleSchema;
}