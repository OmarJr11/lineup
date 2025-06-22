import { User } from '../../entities';
import { ProvidersEnum, StatusEnum } from '../enums';

export interface ILoginResponse {
    code: number;
    status: boolean;
    message: string;
    user: User;
    token?: string;
    refreshToken?: string;
    auth2fa?: boolean;
}

export interface IProviderSocialMedia {
    email: string;
    username?: string;
    firstName: string;
    lastName: string;
    status: StatusEnum;
    provider: ProvidersEnum;
    password?: string;
    imgCode?: string;
    emailValidated?: boolean;
    code?: string;
}
