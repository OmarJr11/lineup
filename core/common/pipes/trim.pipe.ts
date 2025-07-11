import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
@Injectable()
export class TrimPipe implements PipeTransform {
    transform(values: any, metadata: ArgumentMetadata) {
        const { type } = metadata;
        if (type === 'body') {
            if (this.isObj(values)) {
                return this.trimObject(values);
            } else if (typeof values === 'string') {
                return this.trimString(values);
            }
        }
        return values;
    }

    private isObj(obj: any): boolean {
        return typeof obj === 'object' && obj !== null;
    }

    private trimObject(values: object): object {
        Object.keys(values).forEach((key) => {
            if (this.isObj(values[key])) {
                values[key] = this.trimObject(values[key]);
            } else if (typeof values[key] === 'string') {
                values[key] = this.trimString(values[key]);
            }
        });
        return values;
    }

    private trimString(value: string): string {
        const trimValue = value.trim();
        return trimValue === 'null' ? null : trimValue;
    }
}
