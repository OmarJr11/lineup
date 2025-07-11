import { User } from '../../entities';

export interface ILogin {
    token?: string;
    refreshToken?: string;
    user: User;
    message?: string;
    status?: boolean;
    code?: number;
}
