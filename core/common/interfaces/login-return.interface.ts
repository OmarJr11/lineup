import { User } from '../../entities';

export interface ILoginReturn {
    user: User;
    token?: string;
    refreshToken?: string;
}
