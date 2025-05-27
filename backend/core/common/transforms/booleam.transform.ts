import { TransformFnParams } from 'class-transformer';

export const TransformBoolean = ({ value }: TransformFnParams) => {
    switch (typeof value) {
        case 'boolean':
            return value;
        case 'string':
            return value === 'true' || value == 'false'
                ? new Map([
                      ['true', true],
                      ['false', false],
                  ]).get(value)
                : value;
        default:
            return value;
    }
};
