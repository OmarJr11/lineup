import * as jwt from 'jsonwebtoken';

export interface ITokenGenerate {
    username?: string;
    path?: string;
    isBusiness?: boolean;
    email: string;
    sub: number;
    status: string;
    options?: jwt.SignOptions;
}
