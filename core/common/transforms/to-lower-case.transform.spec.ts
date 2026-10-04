import { BadRequestException } from '@nestjs/common';
import { toLowerCase } from './to-lower-case.transform';

describe('toLowerCase transform', () => {
  it('converts string value to lower case', () => {
    expect(toLowerCase({ value: 'HELLO World' })).toBe('hello world');
    expect(toLowerCase({ value: 'UPPER' })).toBe('upper');
  });

  it('throws BadRequestException when value is not a string', () => {
    expect(() => toLowerCase({ value: 123 } as any)).toThrow(
      BadRequestException,
    );
    expect(() => toLowerCase({ value: null } as any)).toThrow(
      BadRequestException,
    );
  });
});
