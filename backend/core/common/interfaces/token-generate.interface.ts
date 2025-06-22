import * as jwt from 'jsonwebtoken';

export interface ITokenGenerate {
    username: string;
    email: string;
    sub: number;
    status: string;
    options?: jwt.SignOptions;
}
