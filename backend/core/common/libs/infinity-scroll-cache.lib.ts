import { InfinityScrollDto } from '../dtos';
import { IInfiniteScroll } from '../interfaces';
import _ = require('lodash');

export function generateInfinityScrollCacheLib(entities: any[], options: InfinityScrollDto): any[] {
    const limit = Number(options.limit) || 10;
    const page = Number(options.page) || 1;
    const orderBy = options.orderBy;
    const order = options.order;
    const minPrice = Number(options.minPrice);
    const maxPrice = Number(options.maxPrice);

    if (orderBy) {
        entities = _.orderBy(entities, [orderBy], [order === 'ASC' ? 'asc' : 'desc']);
    }

    if (minPrice) {
        entities = entities.filter((entity) => Number(entity.price) >= Number(minPrice));
    }

    if (maxPrice) {
        entities = entities.filter((entity) => Number(entity.price) >= Number(maxPrice));
    }

    return entities.slice((page - 1) * limit, page * limit);
}

export function paginateForInfiniteScroll(
    entity: any[],
    page: number,
    total: number
): IInfiniteScroll {
    return {
        items: [...entity],
        itemCount: entity.length,
        totalItems: total,
        pageCount: page,
        next: '',
        last: '',
    };
}
