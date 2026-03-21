import { Injectable } from '@nestjs/common';
import { Product } from '../../entities';
import { ProductsGettersService } from '../products/products-getters.service';
import { ProductSearchIndexGettersService } from '../search/product-search-index-getters.service';
import { SearchService } from '../search/search.service';
import { UserSearchesService } from '../user-searches/user-searches.service';
import { UsersGettersService } from '../users/users.getters.service';
import { ProductVisitsGettersService } from '../product-visits/product-visits-getters.service';
import { ProductReactionsGettersService } from '../product-reactions/product-reactions-getters.service';
import { InfinityScrollInput } from '../../common/dtos';
import { SearchTargetEnum } from '../../common/enums';
import { IProductCollection } from './interfaces/product-collection.interface';

/** Default number of products per collection. */
const DEFAULT_COLLECTION_LIMIT = 10;

/**
 * Service that builds dynamic product collections for personalized recommendations.
 * Collections are computed on each request and not persisted.
 */
@Injectable()
export class ProductCollectionsService {
  constructor(
    private readonly productsGettersService: ProductsGettersService,
    private readonly productSearchIndexGettersService: ProductSearchIndexGettersService,
    private readonly searchService: SearchService,
    private readonly userSearchesService: UserSearchesService,
    private readonly usersGettersService: UsersGettersService,
    private readonly productVisitsGettersService: ProductVisitsGettersService,
    private readonly productReactionsGettersService: ProductReactionsGettersService,
  ) {}

  /**
   * Gets all product collections for a user (or fallback collections when anonymous).
   * @param {number | null} idUser - The user ID, or null for anonymous.
   * @returns {Promise<IProductCollection[]>} Array of product collections.
   */
  async getCollections(idUser: number | null): Promise<IProductCollection[]> {
    const collections: IProductCollection[] = [];
    if (idUser) {
      const visitedTags = await this.buildCollectionFromVisitedTags(idUser);
      if (visitedTags.products.length > 0) {
        collections.push(visitedTags);
      }
      const likedTags = await this.buildCollectionFromLikedTags(idUser);
      if (likedTags.products.length > 0) {
        collections.push(likedTags);
      }
      const byLocation = await this.buildCollectionByUserLocation(idUser);
      if (byLocation.products.length > 0) {
        collections.push(byLocation);
      }
      const bySearches = await this.buildCollectionFromSearchHistory(idUser);
      if (bySearches.products.length > 0) {
        collections.push(bySearches);
      }
    }
    if (collections.length === 0) {
      return await this.buildFallbackCollections();
    }
    return collections;
  }

  /**
   * Builds a collection from tags of products the user has visited.
   * @param {number} idUser - The user ID.
   * @returns {Promise<IProductCollection>} The product collection.
   */
  private async buildCollectionFromVisitedTags(
    idUser: number,
  ): Promise<IProductCollection> {
    const tagIds =
      await this.productVisitsGettersService.getTagIdsFromVisitedProducts(
        idUser,
      );
    if (tagIds.length === 0) {
      return {
        id: 'visited-tags',
        title: 'Basado en lo que visitaste',
        products: [],
      };
    }
    const productIds = await this.productsGettersService.findProductIdsByTagIds(
      tagIds,
      DEFAULT_COLLECTION_LIMIT,
    );
    const products =
      await this.productsGettersService.findManyWithRelations(productIds);
    return {
      id: 'visited-tags',
      title: 'Basado en lo que visitaste',
      products: this.shuffleArray(products),
    };
  }

  /**
   * Builds a collection from tags of products the user has liked.
   */
  private async buildCollectionFromLikedTags(
    idUser: number,
  ): Promise<IProductCollection> {
    const tagIds =
      await this.productReactionsGettersService.getTagIdsFromLikedProducts(
        idUser,
      );
    if (tagIds.length === 0) {
      return { id: 'liked-tags', title: 'Basado en tus likes', products: [] };
    }
    const productIds = await this.productsGettersService.findProductIdsByTagIds(
      tagIds,
      DEFAULT_COLLECTION_LIMIT,
    );
    const products =
      await this.productsGettersService.findManyWithRelations(productIds);
    return {
      id: 'liked-tags',
      title: 'Basado en tus likes',
      products: this.shuffleArray(products),
    };
  }

  /**
   * Builds a collection from products in the user's state/location.
   */
  private async buildCollectionByUserLocation(
    idUser: number,
  ): Promise<IProductCollection> {
    const user = await this.usersGettersService.findOne(idUser);
    const stateName = user?.state?.name;
    if (!stateName) {
      return { id: 'location', title: 'Cerca de ti', products: [] };
    }
    const productIds = await this.getProductIdsByLocationRandom(
      stateName,
      DEFAULT_COLLECTION_LIMIT,
    );
    const products =
      await this.productsGettersService.findManyWithRelations(productIds);
    return {
      id: 'location',
      title: 'Cerca de ti',
      products: this.shuffleArray(products),
    };
  }

  /**
   * Builds a collection from the user's recent search terms.
   */
  private async buildCollectionFromSearchHistory(
    idUser: number,
  ): Promise<IProductCollection> {
    const searchTerms = await this.userSearchesService.getRecentSearchTerms(
      idUser,
      3,
    );
    if (searchTerms.length === 0) {
      return { id: 'searches', title: 'Basado en tus búsquedas', products: [] };
    }
    const allProductIds: number[] = [];
    const seenIds = new Set<number>();
    for (const term of searchTerms) {
      const result = await this.searchService.search(
        { page: 1, limit: 5, search: term } as InfinityScrollInput,
        SearchTargetEnum.PRODUCTS,
      );
      const productItems = result.items.filter(
        (i) => i.__typename === 'ProductSchema',
      );
      for (const item of productItems) {
        const product = (item as { item: Product }).item;
        if (product?.id && !seenIds.has(product.id)) {
          seenIds.add(product.id);
          allProductIds.push(product.id);
        }
      }
    }
    const productIds = this.shuffleArray(allProductIds).slice(
      0,
      DEFAULT_COLLECTION_LIMIT,
    );
    const products =
      await this.productsGettersService.findManyWithRelations(productIds);
    return {
      id: 'searches',
      title: 'Basado en tus búsquedas',
      products: this.shuffleArray(products),
    };
  }

  /**
   * Builds fallback collections when the user has no personalized data.
   */
  private async buildFallbackCollections(): Promise<IProductCollection[]> {
    const [topRatedIds, mostVisitedIds] = await Promise.all([
      this.getTopRatedProductIds(DEFAULT_COLLECTION_LIMIT),
      this.getMostVisitedProductIds(DEFAULT_COLLECTION_LIMIT),
    ]);
    const [topRated, mostVisited] = await Promise.all([
      this.productsGettersService.findManyWithRelations(topRatedIds),
      this.productsGettersService.findManyWithRelations(mostVisitedIds),
    ]);
    return [
      {
        id: 'top-rated',
        title: 'Los mejor valorados',
        products: this.orderByIds(topRated, topRatedIds),
      },
      {
        id: 'most-visited',
        title: 'Los más visitados',
        products: this.orderByIds(mostVisited, mostVisitedIds),
      },
    ];
  }

  /**
   * Gets product IDs by location (state name in locations_text), in random order.
   */
  private async getProductIdsByLocationRandom(
    stateName: string,
    limit: number,
  ): Promise<number[]> {
    return await this.productSearchIndexGettersService.getProductIdsByLocation(
      stateName,
      limit,
    );
  }

  /**
   * Gets top-rated product IDs.
   * Uses product_search_index via getters; falls back to products + product_ratings when empty.
   * Orders by rating descending (highest first), including products with rating 0.
   */
  private async getTopRatedProductIds(limit: number): Promise<number[]> {
    return await this.productSearchIndexGettersService.getTopRatedProductIds(
      limit,
    );
  }

  /**
   * Gets most-visited product IDs.
   * Uses product_search_index via getters; falls back to products table when empty.
   */
  private async getMostVisitedProductIds(limit: number): Promise<number[]> {
    return await this.productSearchIndexGettersService.getMostVisitedProductIds(
      limit,
    );
  }

  /**
   * Orders items by the given id array (preserves query order).
   * Uses Number() for keys to handle bigint/string id from DB.
   */
  private orderByIds<T extends { id?: number | string }>(
    items: T[],
    ids: number[],
  ): T[] {
    const byId = new Map<number, T>(
      items.map((item) => [Number(item.id), item]),
    );
    return ids
      .map((id) => byId.get(id))
      .filter((item): item is T => item != null);
  }

  /**
   * Shuffles an array using Fisher-Yates algorithm.
   */
  private shuffleArray<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
