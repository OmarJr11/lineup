import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { optionalTokenExtractor } from '../extractor/optional-token-extractor.extractor';
import { IUserReq } from '../interfaces';

/**
 * Optional JWT guard that populates request.user when a valid token is present,
 * but does not throw when the token is absent or invalid.
 * Use for public endpoints that can optionally use the authenticated user.
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
    private readonly logger = new Logger(OptionalJwtAuthGuard.name);

    constructor(private readonly jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = this.getRequest(context);
        if (!request) return true;
        const token = optionalTokenExtractor(request);
        if (!token) {
            request.user = null;
            return true;
        }
        try {
            const payload = this.jwtService.verify<{
                isBusiness: boolean;
                sub: string | number;
                username?: string;
                path?: string;
            }>(token);
            if (payload?.isBusiness) {
                request.user = null;
            } else {
                request.user = {
                    userId: Number(payload.sub),
                    username: payload.username ?? '',
                } as IUserReq;
            }
        } catch {
            request.user = null;
        }
        return true;
    }

    private getRequest(context: ExecutionContext): Request | null {
        const httpReq = context.switchToHttp().getRequest();
        if (httpReq) return httpReq;
        const gqlCtx = GqlExecutionContext.create(context);
        return gqlCtx.getContext()?.req ?? null;
    }
}
