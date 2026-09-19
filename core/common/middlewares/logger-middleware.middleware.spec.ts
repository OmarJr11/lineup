import { ConfigService } from '@nestjs/config';
import { LoggerMiddleware } from './logger-middleware.middleware';

/**
 * Unit tests for {@link LoggerMiddleware}.
 */
describe('LoggerMiddleware', () => {
  let middleware: LoggerMiddleware;
  const configServiceMock = {
    get: jest.fn(),
  } as unknown as ConfigService;

  const buildRequest = (overrides: Record<string, any> = {}) =>
    ({
      body: {},
      headers: {},
      ip: '::ffff:127.0.0.1',
      method: 'GET',
      _parsedUrl: { pathname: '/test' },
      ...overrides,
    }) as any;

  const buildResponse = () => ({}) as any;

  beforeEach(() => {
    jest.clearAllMocks();
    middleware = new LoggerMiddleware(configServiceMock);
  });

  it('calls next() in test environment without logging', () => {
    (configServiceMock.get as jest.Mock).mockReturnValue('test');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const next = jest.fn();

    middleware.use(buildRequest(), buildResponse(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('logs request info in non-test environment', () => {
    (configServiceMock.get as jest.Mock).mockReturnValue('development');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const next = jest.fn();

    middleware.use(
      buildRequest({ method: 'POST', _parsedUrl: { pathname: '/api/data' } }),
      buildResponse(),
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });

  it('cleanObject masks password field', () => {
    const body = { username: 'alice', password: 'secret123' };

    const result = middleware.cleanObject(body);

    expect(result.password).toBe('******');
    expect(result.username).toBe('alice');
  });
});
