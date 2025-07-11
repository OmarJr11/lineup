import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError } from 'jsonwebtoken';

/**
 * Customized guard to return predefined response when token is not valid
 */
@Injectable()
export class TokenInfoGuard extends AuthGuard('jwt') {
    private readonly logger = new Logger(TokenInfoGuard.name);
    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();

        if (!request?.cookies?.token && !request?.headers?.token) {
            return true;
        }

        return super.canActivate(context);
    }

    handleRequest(err, user, info): any {
        if (info instanceof TokenExpiredError) {
            return null;
        }
        if (err) {
            return null;
        }

        if (!user) {
            return null;
        }
        this.logger.log(`user => ${JSON.stringify(user)}`);
        return user;
    }
}
