import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { cookieOrHeaderExtractor } from '../../common/extractor/cookie-or-header-extractor.extractor';
import { IUserOrBusinessReq } from '../interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: cookieOrHeaderExtractor,
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET,
        });
    }

    async validate(
        payload: { 
            isBusiness: boolean;
            sub: string | number | Date;
            username: string,
            path: string
        }
    ): Promise<IUserOrBusinessReq> {
        return payload.isBusiness 
            ? {
                businessId: Number(payload.sub),
                path: payload.path,
              } 
            : {
                userId: Number(payload.sub),
                username: payload.username,
             };
    }
}
