import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { IReqWithCookies } from '../interfaces/req-with-cookies.interface';

@Injectable()
export class TokenHeaderInterceptor implements NestInterceptor {
    private readonly logger = new Logger(TokenHeaderInterceptor.name);
    constructor(private readonly jwtService: JwtService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const res = context.switchToHttp().getResponse<Response>();
        const req = context.switchToHttp().getRequest<IReqWithCookies>();
        return next.handle().pipe(
            tap((data) => {
                // get token from body or request header
                const token = data.token || req.header('token');
                const tokenDecoded = this.jwtService.decode(token);
                const validityDuration =
                    tokenDecoded && tokenDecoded['exp'] && tokenDecoded['iat']
                        ? tokenDecoded['exp'] - tokenDecoded['iat']
                        : 0;
                res.setHeader('token_expired', validityDuration);
            })
        );
    }
}
