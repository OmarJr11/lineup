import { UnauthorizedException } from '@nestjs/common';
import { userResponses } from '../responses';

export const cookieOrHeaderExtractor = (req) => {
    let token = null;
    if (req.headers.token) {
        token = req.headers.token;
    }

    if (!req.headers.token) {
        throw new UnauthorizedException(userResponses.refreshToken.cookieNotSent);
    }

    return token;
};
