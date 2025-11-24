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
        const cookiesToken = request?.cookies && request.cookies.token;
        const headerToken = request?.headers && (request.headers['token'] || request.headers['Token']);
        const authHeader = request?.headers && (request.headers['authorization'] || request.headers['Authorization']);
        let token: string | undefined = undefined;

        if (cookiesToken) token = cookiesToken;
        else if (headerToken) token = headerToken as string;
        else if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (request?.headers?.cookie && typeof request.headers.cookie === 'string') {
            // Fallback: parse raw cookie header for a token key
            const raw = request.headers.cookie as string;
            const match = raw.split(';').map(s => s.trim()).find(s => s.startsWith('token='));
            if (match) token = decodeURIComponent(match.split('=')[1]);
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
