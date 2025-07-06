import { Role } from '../../entities';
import { RoleSchema } from '../../schemas';

export function toRoleSchema(role: Role): RoleSchema {
    return {
        ...role,
    } as RoleSchema;
}