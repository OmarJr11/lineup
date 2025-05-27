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
    const category = Number(options.category);
    const state = Number(options.state);
    const municipality = Number(options.municipality);

    if (orderBy) {
        entities = _.orderBy(entities, [orderBy], [order === 'ASC' ? 'asc' : 'desc']);
    }

    if (minPrice) {
        entities = entities.filter((entity) => Number(entity.price) >= Number(minPrice));
    }

    if (maxPrice) {
        entities = entities.filter((entity) => Number(entity.price) >= Number(maxPrice));
    }

    if (category) {
        entities = entities.filter(
            (entity) =>
                Number(entity.category.id) === Number(category) ||
                Number(entity.category.idParent.id) === Number(category)
        );
    }

    if (state) {
        entities = entities.filter(
            (entity) => Number(entity.locations[0].idState) === Number(state)
        );
    }

    if (municipality) {
        entities = entities.filter(
            (entity) => Number(entity.locations[0].idMunicipality) === Number(municipality)
        );
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
