import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { TokensService } from '../../modules/token/token.service';
import { IResponse } from '../interfaces';

@Injectable()
export class TokenGuard implements CanActivate {
    private readonly response: IResponse = {
        code: 3,
        status: false,
        message: 'Token not found',
    };

    constructor(private readonly _tokenService: TokensService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        let request = context.switchToHttp().getRequest();
        if (!request) {
            const gqlCtx = context.getArgByIndex(2);
            request = gqlCtx?.req;
        }
        const token = request.headers['token']; // Get the token from the header
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
