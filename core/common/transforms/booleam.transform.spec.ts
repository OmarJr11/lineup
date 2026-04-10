import { TransformBoolean } from './booleam.transform';

/**
 * Unit tests for {@link TransformBoolean}.
 */
describe('TransformBoolean', () => {
  it('passes booleans through', () => {
    expect(TransformBoolean({ value: true } as never)).toBe(true);
    expect(TransformBoolean({ value: false } as never)).toBe(false);
  });

  it('maps string true and false', () => {
    expect(TransformBoolean({ value: 'true' } as never)).toBe(true);
    expect(TransformBoolean({ value: 'false' } as never)).toBe(false);
  });

  it('returns other strings unchanged', () => {
    expect(TransformBoolean({ value: 'maybe' } as never)).toBe('maybe');
  });
});
