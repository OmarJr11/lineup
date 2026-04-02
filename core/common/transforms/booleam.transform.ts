import type { TransformFnParams } from 'class-transformer';

export const TransformBoolean = ({ value }: TransformFnParams): unknown => {
  const v: unknown = value;
  switch (typeof v) {
    case 'boolean':
      return v;
    case 'string':
      if (v === 'true') {
        return true;
      }
      if (v === 'false') {
        return false;
      }
      return v;
    default:
      return v;
  }
};
