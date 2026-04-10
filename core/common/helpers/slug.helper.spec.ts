import { toSlug } from './slug.helper';

/**
 * Unit tests for {@link toSlug}.
 */
describe('toSlug', () => {
  it('lowercases, trims, and replaces spaces with hyphens', () => {
    expect(toSlug('  Hello World  ')).toBe('hello-world');
  });

  it('strips punctuation and collapses hyphens', () => {
    expect(toSlug('Foo -- Bar!!!')).toBe('foo-bar');
  });
});
