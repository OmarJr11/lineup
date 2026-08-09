import type { IUserOrBusinessReq } from '../core/common/interfaces/user-or-business-req.interface';

/**
 * Express 5 exposes request extensions through the global `Express` namespace.
 * Passport apps already get `Request.user` from `@types/passport`; background
 * processes do not load passport, so this declaration keeps `req.user` typed
 * consistently across all apps.
 */
declare global {
  namespace Express {
    interface User extends IUserOrBusinessReq {}

    interface Request {
      user?: User;
    }
  }
}

export {};
