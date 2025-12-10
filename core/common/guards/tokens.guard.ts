import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { TokensService } from '../../modules/token/token.service';
import { IResponse } from '../interfaces';
import { userResponses } from '../responses';

@Injectable()
export class TokenGuard implements CanActivate {
    private readonly response: IResponse = userResponses.token.tokenNotFound;

    constructor(private readonly _tokenService: TokensService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        let request = context.switchToHttp().getRequest();
        if (!request) {
            const gqlCtx = context.getArgByIndex(2);
            request = gqlCtx?.req;
        }
        // Try multiple token sources: cookie, custom header, Authorization bearer, raw Cookie header
        // Accept cookies named 'token' or any cookie key that ends with 'token'
        let cookiesToken: string | undefined = undefined;
        if (request?.cookies) {
            if (request.cookies.token) cookiesToken = request.cookies.token;
            else {
                const keys = Object.keys(request.cookies || {});
                const preferEndToken = keys.find(k => typeof k === 'string' && /token$/i.test(k) && !/refresh/i.test(k));
                if (preferEndToken) cookiesToken = request.cookies[preferEndToken];
                else {
                    const anyToken = keys.find(k => typeof k === 'string' && k.toLowerCase().includes('token') && !k.toLowerCase().includes('refresh'));
                    if (anyToken) cookiesToken = request.cookies[anyToken];
                }
            }
        }
        const headerToken = request?.headers && (request.headers['token'] || request.headers['Token']);
        const authHeader = request?.headers && (request.headers['authorization'] || request.headers['Authorization']);
        let token: string | undefined = undefined;

        if (cookiesToken) token = cookiesToken;
        else if (headerToken) token = headerToken as string;
        else if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (request?.headers?.cookie && typeof request.headers.cookie === 'string') {
            // Fallback: parse raw cookie header for a token key (support keys ending with 'token')
            const raw = request.headers.cookie as string;
            const parts = raw.split(';').map(s => s.trim());
            // prefer keys that end with token and are not refresh
            const prefer = parts.find(p => {
                const [k] = p.split('=');
                return /token$/i.test(k) && !/refresh/i.test(k);
            });
            if (prefer) token = decodeURIComponent(prefer.split('=')[1]);
            else {
                const any = parts.find(p => {
                    const [k] = p.split('=');
                    return k.toLowerCase().includes('token') && !k.toLowerCase().includes('refresh');
                });
                if (any) token = decodeURIComponent(any.split('=')[1]);
            }
        }

        return await this.checkIfTokenIsValid(token);
    }

    /**
     * Check if the token is valid
     * @param {string} token - token to check
     * @returns {Promise<boolean>}
     **/
    async checkIfTokenIsValid(token: string): Promise<boolean> {
        if (!token) {
            throw new UnauthorizedException(this.response);
        }
        await this._tokenService.getTokenByToken(token, this.response);
        return true;
    }
}
