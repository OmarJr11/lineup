import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
    getAcceptableDomains,
    getRequestAgent,
    invalidReferersRequest,
} from '../helpers/requests.helper';
import { IReqWithCookies } from './req-with-cookies.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ICookieInterceptor implements NestInterceptor {
    constructor(
        private readonly configService: ConfigService,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest<IReqWithCookies>();
        const res = context.switchToHttp().getResponse<Response>();

        return next.handle().pipe(
            tap(() => {
                const cookies = req._cookies;
                const date = new Date();

                // 6 months to expired the cookies
                date.setTime(date.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);

                const expires = date.toISOString();

                const domains = getAcceptableDomains();
                const agent = getRequestAgent(req, domains);

                const logger: Logger = new Logger('CookieInterceptor');
                logger.log(agent);

                if (cookies?.length && invalidReferersRequest(req)) {
                    cookies.forEach((cookie) => {
                        res.cookie(cookie.name, cookie.val, {
                            domain: agent,
                            secure: agent.includes(this.configService.get<string>('MAIN_DOMAIN')),
                            httpOnly: agent.includes(this.configService.get<string>('MAIN_DOMAIN')),
                            expires: new Date(expires),
                        });
                    });
                }
            })
        );
    }
}
