import type { ExecutionContext } from '@nestjs/common';
import { GqlThrottlerGuard } from './gql-throttler.guard';

describe('GqlThrottlerGuard', () => {
  let guard: GqlThrottlerGuard;

  beforeEach(() => {
    guard = Object.create(GqlThrottlerGuard.prototype);
  });

  it('should return req and res from GraphQL context when available', () => {
    const mockReq = { headers: {}, ip: '127.0.0.1' };
    const mockRes = { setHeader: jest.fn() };

    const mockContext = {
      getType: () => 'graphql',
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getArgs: () => [{}, {}, { req: mockReq, res: mockRes }, {}],
      getArgByIndex: (index: number) => {
        if (index === 2) return { req: mockReq, res: mockRes };
        return null;
      },
      switchToHttp: () => ({
        getRequest: () => null,
        getResponse: () => null,
      }),
    } as unknown as ExecutionContext;

    const result = guard.getRequestResponse(mockContext);
    expect(result).toEqual({ req: mockReq, res: mockRes });
  });

  it('should fallback to HTTP context when GraphQL context does not contain req', () => {
    const mockReq = { headers: {}, ip: '192.168.1.1' };
    const mockRes = { setHeader: jest.fn() };

    const mockContext = {
      getType: () => 'http',
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getArgs: () => [],
      getArgByIndex: () => null,
      switchToHttp: () => ({
        getRequest: () => mockReq,
        getResponse: () => mockRes,
      }),
    } as unknown as ExecutionContext;

    const result = guard.getRequestResponse(mockContext);
    expect(result).toEqual({ req: mockReq, res: mockRes });
  });
});
