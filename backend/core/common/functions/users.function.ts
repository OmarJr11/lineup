import { User } from '../../entities';
import { UserSchema } from '../../schemas';


export function toUserSchema(user: User): UserSchema {
    return user as UserSchema;
}