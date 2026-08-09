import type { Request } from 'express';
import {
  getAcceptableDomains,
  getRequestAgent,
  invalidReferersRequest,
} from './requests.helper';

/**
 * Unit tests for request referer helpers.
 */
describe('requests.helper', () => {
  const originalReferer = process.env.REQUEST_REFERER;
  const originalMain = process.env.MAIN_DOMAIN;

  afterEach(() => {
    process.env.REQUEST_REFERER = originalReferer;
    process.env.MAIN_DOMAIN = originalMain;
  });

  describe('invalidReferersRequest', () => {
    it('returns false when referer header contains a blocked substring', () => {
      process.env.REQUEST_REFERER = 'bad.com,other.org';
      const req = {
        get: jest.fn().mockReturnValue('https://bad.com/page'),
      } as unknown as Request;
      expect(invalidReferersRequest(req)).toBe(false);
    });

    it('returns true when header does not include any blocked referer', () => {
      process.env.REQUEST_REFERER = 'bad.com';
      const req = {
        get: jest.fn().mockReturnValue('https://good.com'),
      } as unknown as Request;
      expect(invalidReferersRequest(req)).toBe(true);
    });
  });

  describe('getAcceptableDomains', () => {
    it('splits MAIN_DOMAIN by comma and trims', () => {
      process.env.MAIN_DOMAIN = ' a.com , b.com ';
      expect(getAcceptableDomains()).toEqual(['a.com', 'b.com']);
    });
  });

  describe('getRequestAgent', () => {
    it('returns matching domain when referer includes it', () => {
      const req = {
        get: jest.fn().mockReturnValue('https://shop.example.com'),
      } as unknown as Request;
      expect(getRequestAgent(req, ['shop.example.com', 'other'])).toBe(
        'shop.example.com',
      );
    });

    it('returns localhost when no domain matches', () => {
      const req = {
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as Request;
      expect(getRequestAgent(req, ['x.com'])).toBe('localhost');
    });
  });
});
