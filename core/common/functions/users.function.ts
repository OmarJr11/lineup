import type { User } from '../../entities';
import type { UserSchema } from '../../schemas';

export function toUserSchema(user: User): UserSchema {
  return user as UserSchema;
}
