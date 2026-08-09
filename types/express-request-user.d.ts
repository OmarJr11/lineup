import type { IUserOrBusinessReq } from '../core/common/interfaces/user-or-business-req.interface';

declare module 'express-serve-static-core' {
  interface Request {
    user?: IUserOrBusinessReq;
  }
}

export {};
