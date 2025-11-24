import { Business, User } from '../../entities';
import { ProvidersEnum, StatusEnum } from '../enums';

export interface ILoginResponse {
    code: number;
    status: boolean;
    message: string;
    user?: User;
    business?: Business;
    token?: string;
    refreshToken?: string;
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
