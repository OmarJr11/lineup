import { toLowerCaseWithoutAccents } from './words.helper';

/**
 * Unit tests for {@link toLowerCaseWithoutAccents}.
 */
describe('toLowerCaseWithoutAccents', () => {
  it('returns empty for falsy input', () => {
    expect(toLowerCaseWithoutAccents('')).toBe('');
  });

  it('strips accents and lowercases', () => {
    expect(toLowerCaseWithoutAccents('Árbol')).toBe('arbol');
  });
});
