import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';

export const BusinessDec = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    let request = ctx.switchToHttp().getRequest();
    if (!request) {
      const gqlCtx = ctx.getArgByIndex(2);
      request = gqlCtx?.req;
    }
    return request?.user;
  },
);
