import { BadRequestException } from '@nestjs/common';

export function toLowerCase<T>(value: T): string {
    if (typeof value['value'] === 'string') {
        return value['value'].toLowerCase();
    }

    throw new BadRequestException('Value is not a string.');
}
