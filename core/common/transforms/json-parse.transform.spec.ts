import { JsonParse } from './json-parse.transform';

describe('JsonParse transform', () => {
  it('parses valid JSON string in value property', () => {
    const input = { value: '{"key":"value","count":10}' };
    expect(JsonParse(input)).toEqual({ key: 'value', count: 10 });
  });

  it('returns null if string is "null"', () => {
    const input = { value: 'null' };
    expect(JsonParse(input)).toBeNull();
  });

  it('returns raw value if value is not a string', () => {
    const input1 = { value: 123 };
    expect(JsonParse(input1)).toBe(123);

    const input2 = { value: [1, 2, 3] };
    expect(JsonParse(input2)).toEqual([1, 2, 3]);

    const input3 = { value: null };
    expect(JsonParse(input3)).toBeNull();
  });
});
