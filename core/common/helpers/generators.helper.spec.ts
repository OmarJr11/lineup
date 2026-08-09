import { generateRandomCodeByLength } from './generators.helper';

/**
 * Unit tests for {@link generateRandomCodeByLength}.
 */
describe('generateRandomCodeByLength', () => {
  it('returns a string of the requested length using charset', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    expect(generateRandomCodeByLength(4)).toBe('AAAA');
    jest.restoreAllMocks();
  });

  it('returns empty string for zero length', () => {
    expect(generateRandomCodeByLength(0)).toBe('');
  });
});
