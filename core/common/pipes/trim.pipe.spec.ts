import { TrimPipe } from './trim.pipe';

/**
 * Unit tests for {@link TrimPipe}.
 */
describe('TrimPipe', () => {
  const pipe = new TrimPipe();

  it('trims string fields on body metadata', () => {
    const result = pipe.transform(
      { name: '  hello  ', nested: { x: '  y  ' } },
      { type: 'body', metatype: Object, data: '' },
    );
    expect(result).toEqual({ name: 'hello', nested: { x: 'y' } });
  });

  it('maps trimmed string "null" to null', () => {
    const result = pipe.transform(
      { v: 'null' },
      { type: 'body', metatype: Object, data: '' },
    );
    expect(result).toEqual({ v: null });
  });

  it('returns value unchanged for non-body types', () => {
    const q = { a: '  b  ' };
    expect(
      pipe.transform(q, { type: 'query', metatype: Object, data: '' }),
    ).toBe(q);
  });
});
