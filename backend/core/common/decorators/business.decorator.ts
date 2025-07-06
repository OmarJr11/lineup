import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const BusinessDec = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    // Primero intenta HTTP
    let request = ctx.switchToHttp().getRequest();
    // Si es GraphQL, obtén el request del contexto de GraphQL
    if (!request) {
        const gqlCtx = ctx.getArgByIndex(2);
        request = gqlCtx?.req;
    }
    return request?.user;
});