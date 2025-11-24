import { UnauthorizedException } from '@nestjs/common';
import { userResponses } from '../responses';

export const cookieOrHeaderExtractor = (req) => {
    let token: string = null;

    // 1) Check cookie (preferred when using HttpOnly cookies)
    if (req.cookies && req.cookies.token) return req.cookies.token as string;

    // 2) Check custom header `token`
    if (
        !token && req.headers && req.headers.token
    ) return req.headers.token as string;

    throw new UnauthorizedException(userResponses.token.cookieNotSent);
};
