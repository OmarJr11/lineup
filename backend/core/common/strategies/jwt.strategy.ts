import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { cookieOrHeaderExtractor } from '../../common/extractor/cookie-or-header-extractor.extractor';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: cookieOrHeaderExtractor,
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET,
        });
    }

    async validate(payload: { sub: string | number | Date; username: any }) {
        return {
            userId: payload.sub,
            username: payload.username,
        };
    }
}
