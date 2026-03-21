import type { Logger } from '@nestjs/common';
import type { Business, User } from '../../entities';
import type { IUserOrBusinessReq, IUserReq } from '../interfaces';

export const LogError = (
  logger: Logger,
  error: string | Record<string, unknown> | Error,
  functionWithError: string,
  user?: IUserOrBusinessReq,
) => {
  if (error instanceof Error) {
    logger.error(
      `[${functionWithError}]${user ? ' =>' + JSON.stringify(user) : ''} => ${error.stack}`,
    );
  } else {
    logger.error(
      `[${functionWithError}]${user ? ' =>' + JSON.stringify(user) : ''} => ${error}`,
    );
  }
};

export const Log = (
  logger: Logger,
  message: string | Record<string, unknown>,
  functionLoggedFrom: string,
  user?: IUserReq | User,
) => {
  logger.log(
    `[${functionLoggedFrom}]${user ? ' =>' + JSON.stringify(user) : ''} => ${message}`,
  );
};

export const LogWarn = (
  logger: Logger,
  warn: string | Record<string, unknown> | Error,
  functionWithError: string,
  user?: IUserOrBusinessReq | User | Business,
) => {
  if (warn instanceof Error) {
    logger.warn(
      `[${functionWithError}]${user ? ' =>' + JSON.stringify(user) : ''} => ${warn.stack}`,
    );
  } else {
    logger.warn(
      `[${functionWithError}]${user ? ' =>' + JSON.stringify(user) : ''} => ${warn}`,
    );
  }
};
