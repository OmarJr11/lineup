import * as jwt from 'jsonwebtoken';

export interface ITokenGenerate {
    username: string;
    mail: string;
    sub: number;
    status: string;
    options?: jwt.SignOptions;
}
