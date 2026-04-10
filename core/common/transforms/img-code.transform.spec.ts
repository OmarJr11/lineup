import { ImageCode } from './img-code.transform';

/**
 * Unit tests for {@link ImageCode}.
 */
describe('ImageCode', () => {
  it('returns null when value is blank string', () => {
    expect(ImageCode({ value: '   ' } as never)).toBeNull();
  });

  it('returns inner value when non-empty', () => {
    expect(ImageCode({ value: 'abc' } as never)).toBe('abc');
  });
});
