import { User } from '../../entities';
import { UserSchema } from '../../schemas';


export function toUserSchema(user: User): UserSchema {
    return {
        ...user,
        createdRoles: user.createdRoles || [],
        modifiedRoles: user.modifiedRoles || [],
        createdUserRoles: user.createdUserRoles || [],
        userRoles: user.userRoles || [],
        files: user.files || [],
    } as UserSchema;
}