import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const UserDec = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    // Support both HTTP and GraphQL contexts
    const gqlCtx = GqlExecutionContext.create?.(ctx);
    const request = gqlCtx ? gqlCtx.getContext()?.req : ctx.switchToHttp().getRequest();
    return request?.user;
});
