import {
  cartesianProduct,
  generateSkuCode,
} from './cartesian-product.helper';

/**
 * Unit tests for cartesian product and SKU helpers.
 */
describe('cartesianProduct', () => {
  it('returns one empty combination for empty input', () => {
    expect(cartesianProduct([])).toEqual([[]]);
  });

  it('returns tuples for two dimensions', () => {
    expect(cartesianProduct([['a', 'b'], ['1', '2']])).toEqual([
      ['a', '1'],
      ['a', '2'],
      ['b', '1'],
      ['b', '2'],
    ]);
  });
});

describe('generateSkuCode', () => {
  it('returns P{id} when no variation options', () => {
    expect(generateSkuCode(12, {})).toBe('P12');
  });

  it('builds suffix from sorted variation keys', () => {
    const code = generateSkuCode(5, {
      Size: 'large',
      Color: 'red',
    });
    expect(code.startsWith('P5-')).toBe(true);
    expect(code).toContain('RED');
    expect(code).toContain('LARG');
  });
});
