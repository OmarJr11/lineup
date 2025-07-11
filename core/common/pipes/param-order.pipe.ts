import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
@Injectable()
export class ParamOrderPipe implements PipeTransform {
    transform(values: any, metadata: ArgumentMetadata) {
        const { type } = metadata;

        if (type === 'query' && metadata.data === 'order' && values) {
            switch (values.toUpperCase()) {
                case 'ASC':
                    values = 'ASC';
                    break;
                case 'DESC':
                    values = 'DESC';
                    break;
                default:
                    values = undefined;
            }
        }

        return values;
    }
}
