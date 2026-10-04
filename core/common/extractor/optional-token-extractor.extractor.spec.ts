import { optionalTokenExtractor } from './optional-token-extractor.extractor';

describe('optionalTokenExtractor', () => {
  it('returns null when req is undefined or null', () => {
    expect(optionalTokenExtractor(null)).toBeNull();
    expect(optionalTokenExtractor(undefined)).toBeNull();
    expect(optionalTokenExtractor({})).toBeNull();
  });

  it('extracts token from req.cookies.token', () => {
    const req = { cookies: { token: 'jwt-123' } };
    expect(optionalTokenExtractor(req)).toBe('jwt-123');
  });

  it('extracts token from req.cookies with key ending in token', () => {
    const req = { cookies: { myApp_token: 'cookie-token-end' } };
    expect(optionalTokenExtractor(req)).toBe('cookie-token-end');
  });

  it('extracts token from req.cookies with key containing token but not refresh', () => {
    const req = {
      cookies: {
        refresh_token: 'refresh-val',
        user_token_access: 'access-val',
      },
    };
    expect(optionalTokenExtractor(req)).toBe('access-val');
  });

  it('extracts token from req.headers.token', () => {
    const req = { headers: { token: 'header-token' } };
    expect(optionalTokenExtractor(req)).toBe('header-token');
  });

  it('extracts token from Bearer authorization header', () => {
    const req1 = { headers: { authorization: 'Bearer bearer-tok-1' } };
    expect(optionalTokenExtractor(req1)).toBe('bearer-tok-1');

    const req2 = { headers: { Authorization: 'Bearer bearer-tok-2' } };
    expect(optionalTokenExtractor(req2)).toBe('bearer-tok-2');
  });

  it('extracts token from raw cookie header ending in token', () => {
    const req = { headers: { cookie: 'other=123; user_token=raw-token' } };
    expect(optionalTokenExtractor(req)).toBe('raw-token');
  });

  it('extracts token from raw cookie header containing token', () => {
    const req = {
      headers: { cookie: 'refresh_token=ref; token_auth=contained-token' },
    };
    expect(optionalTokenExtractor(req)).toBe('contained-token');
  });

  it('returns null when no matching headers or cookies found', () => {
    const req = {
      headers: {
        authorization: 'Basic xyz',
        cookie: 'sessionId=abc; other=def',
      },
      cookies: {
        refresh_token: 'only-refresh',
      },
    };
    expect(optionalTokenExtractor(req)).toBeNull();
  });
});
