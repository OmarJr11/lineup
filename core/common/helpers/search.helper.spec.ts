import { formatSearchWords } from './search.helper';

/**
 * Unit tests for {@link formatSearchWords}.
 */
describe('formatSearchWords', () => {
  it('wraps alphanumeric runs and maps spaces to percent wildcards', () => {
    expect(formatSearchWords('ab cd')).toBe('%ab%cd%');
  });

  it('maps non-space non-alnum single chars to underscore wildcard', () => {
    expect(formatSearchWords('a-b')).toBe('%a_b%');
  });
});
