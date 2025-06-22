import { ForbiddenException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { cookieOrHeaderExtractor } from '../../common/extractor/cookie-or-header-extractor.extractor';
import { StatusEnum } from '../enums';
import { UsersService } from '../../modules/users/users.service';

@Injectable()
export class WsJwtStrategy extends PassportStrategy(Strategy, 'ws-jwt') {
    constructor(
        private readonly userService: UsersService
    ) {
        super({
            jwtFromRequest: cookieOrHeaderExtractor,
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET,
        });
    }

    async validate(payload: { sub: string | number | Date; username: any }) {
        await this.userService
            .findOneOrFail(payload.sub, { where: [{ status: StatusEnum.ACTIVE }] })
            .catch(() => {
                throw new ForbiddenException({
                    code: 5,
                    status: false,
                    message: 'Logged user is not active',
                });
            });

        return {
            userId: payload.sub,
            username: payload.username,
        };
    }
}
