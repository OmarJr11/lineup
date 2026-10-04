import { UnauthorizedException } from '@nestjs/common';
import { cookieOrHeaderExtractor } from './cookie-or-header-extractor.extractor';
import { userResponses } from '../responses';

describe('cookieOrHeaderExtractor', () => {
  it('returns req.cookies.token if present', () => {
    const req = {
      cookies: {
        token: 'direct-token-value',
      },
    };
    expect(cookieOrHeaderExtractor(req)).toBe('direct-token-value');
  });

  it('prefers cookie name ending with token (excluding refresh)', () => {
    const req = {
      cookies: {
        lineup_token: 'lineup-token-value',
        some_refresh_token: 'refresh-token-value',
      },
    };
    expect(cookieOrHeaderExtractor(req)).toBe('lineup-token-value');
  });

  it('falls back to any cookie containing token (excluding refresh)', () => {
    const req = {
      cookies: {
        my_token_cookie_extra: 'any-token-value',
        refresh_token: 'refresh-val',
      },
    };
    expect(cookieOrHeaderExtractor(req)).toBe('any-token-value');
  });

  it('extracts token from req.headers.token if cookies do not have it', () => {
    const req = {
      cookies: {},
      headers: {
        token: 'header-token-value',
      },
    };
    expect(cookieOrHeaderExtractor(req)).toBe('header-token-value');
  });

  it('extracts token from headers when req.cookies is undefined', () => {
    const req = {
      headers: {
        token: 'header-only-token',
      },
    };
    expect(cookieOrHeaderExtractor(req)).toBe('header-only-token');
  });

  it('throws UnauthorizedException when neither cookies nor headers have token', () => {
    const req = {
      cookies: { other: 'value' },
      headers: {},
    };
    expect(() => cookieOrHeaderExtractor(req)).toThrow(UnauthorizedException);
    expect(() => cookieOrHeaderExtractor(req)).toThrow(
      userResponses.token.cookieNotSent,
    );
  });
});
