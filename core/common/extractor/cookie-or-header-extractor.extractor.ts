import { UnauthorizedException } from '@nestjs/common';
import { userResponses } from '../responses';

export const cookieOrHeaderExtractor = (req) => {
    let token: string = null;

    // 1) Check cookie (preferred when using HttpOnly cookies)
    if (req.cookies) {
        // direct 'token' cookie
        if (req.cookies.token) return req.cookies.token as string;
        // Prefer cookie names that end with 'token' (e.g. 'lineup_token', 'users_token')
        const keys = Object.keys(req.cookies || {});
        const preferEndToken = keys.find(k => typeof k === 'string' && /token$/i.test(k) && !/refresh/i.test(k));
        if (preferEndToken) return req.cookies[preferEndToken] as string;
        // Fallback: find any key that includes 'token' but avoid refresh tokens
        const key = keys.find(k => typeof k === 'string' && k.toLowerCase().includes('token') && !k.toLowerCase().includes('refresh'));
        if (key) return req.cookies[key] as string;
    }

    // 2) Check custom header `token`
    if (
        !token && req.headers && req.headers.token
    ) return req.headers.token as string;

    throw new UnauthorizedException(userResponses.token.cookieNotSent);
};
