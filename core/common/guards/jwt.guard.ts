import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError } from 'jsonwebtoken';
import { LogWarn } from '../helpers/logger.helper';
import { EnvironmentsEnum } from '../enums';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    private readonly logger = new Logger(JwtAuthGuard.name);

    constructor(
        private readonly configService: ConfigService
    ) {
        super();
    }

    getRequest(context: ExecutionContext) {
        // Soporta HTTP y GraphQL
        const ctx = context.switchToHttp();
        if (ctx.getRequest()) {
            return ctx.getRequest();
        }
        // Para GraphQL
        const gqlCtx = context.getArgByIndex(2);
        return gqlCtx?.req;
    }

    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }

    handleRequest(err, data, info): any {
        if (info instanceof TokenExpiredError) {
            throw new UnauthorizedException({
                status: false,
                code: 2,
                message: `${info.name}: ${info.message}`,
                expiredAt: info.expiredAt,
            });
        }
        if (err) {
            throw err;
        }

        if (!data) {
            LogWarn(this.logger, 'user or business not found in token', this.handleRequest.name);
            throw new UnauthorizedException({
                code: 1,
                status: false,
                message: 'Unauthorized',
            });
        }

        if (this.configService.get<string>('NODE_ENV') !== EnvironmentsEnum.Test) {
            this.logger.log(`data => ${JSON.stringify(data)}`);
        }

        if(data.userId) {
            const user = data;
            return user;
        } else {
            const business = data;
            return business;
        }
    }
}