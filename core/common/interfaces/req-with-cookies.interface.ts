import { CookieOptions, Request } from 'express';

export interface IReqWithCookies extends Request {
    _cookies: {
        name: string;
        val: string;
        options?: CookieOptions;
    }[];
}
