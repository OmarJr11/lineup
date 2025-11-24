export interface ILogout {
    token: string;
    refreshToken: string;
    domain: string;
    secure: boolean;
    httpOnly: boolean;
}
