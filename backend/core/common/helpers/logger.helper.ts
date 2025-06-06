import { Logger } from '@nestjs/common';
import { User } from '../../entities';
import { IUserReq } from '../interfaces';

export const LogError = (
    logger: Logger,
    error: string | Record<string, unknown>,
    functionWithError: string,
    user?: IUserReq | User
) => {
    if (error instanceof Error) {
        logger.error(
            `[${functionWithError}]${user ? ' =>' + JSON.stringify(user) : ''} => ${error.stack}`
        );
    } else {
        logger.error(
            `[${functionWithError}]${user ? ' =>' + JSON.stringify(user) : ''} => ${error}`
        );
    }
};

export const Log = (
    logger: Logger,
    message: string | Record<string, unknown>,
    functionLoggedFrom: string,
    user?: IUserReq | User
) => {
    logger.log(`[${functionLoggedFrom}]${user ? ' =>' + JSON.stringify(user) : ''} => ${message}`);
};

export const LogWarn = (
    logger: Logger,
    warn: string | Record<string, unknown>,
    functionWithError: string,
    user?: IUserReq | User
) => {
    if (warn instanceof Error) {
        logger.warn(
            `[${functionWithError}]${user ? ' =>' + JSON.stringify(user) : ''} => ${warn.stack}`
        );
    } else {
        logger.warn(`[${functionWithError}]${user ? ' =>' + JSON.stringify(user) : ''} => ${warn}`);
    }
};
