import { ParamOrderPipe } from './param-order.pipe';

/**
 * Unit tests for {@link ParamOrderPipe}.
 */
describe('ParamOrderPipe', () => {
  const pipe = new ParamOrderPipe();

  it('normalizes order query to ASC', () => {
    expect(
      pipe.transform('asc', {
        type: 'query',
        metatype: String,
        data: 'order',
      }),
    ).toBe('ASC');
  });

  it('normalizes order query to DESC', () => {
    expect(
      pipe.transform('desc', {
        type: 'query',
        metatype: String,
        data: 'order',
      }),
    ).toBe('DESC');
  });

  it('returns undefined for invalid order values', () => {
    expect(
      pipe.transform('invalid', {
        type: 'query',
        metatype: String,
        data: 'order',
      }),
    ).toBeUndefined();
  });

  it('leaves non-order query params unchanged', () => {
    expect(
      pipe.transform('anything', {
        type: 'query',
        metatype: String,
        data: 'page',
      }),
    ).toBe('anything');
  });
});
