import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError } from 'jsonwebtoken';
import { LogWarn } from '../helpers/logger.helper';

@Injectable()
export class WsJwtGuard extends AuthGuard('ws-jwt') {
    private readonly logger = new Logger(WsJwtGuard.name);
    canActivate(context: ExecutionContext) {
        const client = context.switchToWs().getClient();
        const authToken: string = client.handshake?.query?.token;
        context.switchToHttp().getRequest()['url'] = `?token=${authToken}`;
        return super.canActivate(context);
    }

    handleRequest(err, user, info): any {
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

        if (!user) {
            LogWarn(this.logger, 'user not found in token', this.handleRequest.name);
            throw new UnauthorizedException({
                code: 1,
                status: false,
                message: 'Unauthorized',
            });
        }

        this.logger.log(`user => ${JSON.stringify(user)}`);
        return user;
    }
}
