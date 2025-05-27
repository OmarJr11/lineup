import { User } from '../../entities';
import { ProviderEnum, StatusEnum } from '../enum';

export interface ILoginResponse {
    code: number;
    status: boolean;
    message: string;
    user: User;
    token?: string;
    refreshToken?: string;
}

export interface IProviderSocialMedia {
}
