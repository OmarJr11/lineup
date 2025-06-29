import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError } from 'jsonwebtoken';
import { LogWarn } from '../helpers/logger.helper';
import { EnvironmentsEnum } from '../enums';
import { ConfigService } from '@nestjs/config';

/**
 * Customized guard to return predefined response when token is not valid
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    private readonly logger = new Logger(JwtAuthGuard.name);

    constructor(
        private readonly configService: ConfigService
    ) {
        super();
    }

    canActivate(context: ExecutionContext) {
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

        if (this.configService.get<string>('NODE_ENV') !== EnvironmentsEnum.Test) {
            this.logger.log(`user => ${JSON.stringify(user)}`);
        }
        return user;
    }
}
