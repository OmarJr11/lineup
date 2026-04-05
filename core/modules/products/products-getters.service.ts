import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Not, Repository, SelectQueryBuilder } from 'typeorm';
import { BasicService } from '../../common/services';
import { InfinityScrollInput } from '../../common/dtos';
import { StatusEnum } from '../../common/enums';
import { LogError } from '../../common/helpers/logger.helper';
import { productsResponses } from '../../common/responses';
import { Product, ProductRating } from '../../entities';
import {
  IGetTopByVisitsForStatisticsInput,
  IStatItemWithLikes,
  IStatItemWithRating,
  IStatItemWithVisits,
} from '../business-statistics/interfaces';
import { GetAllPrimaryProductsByBusinessInput } from './dto/get-all-primary-products-by-business.input';

@Injectable()
export class ProductsGettersService extends BasicService<Product> {
  private logger = new Logger(ProductsGettersService.name);
  private readonly rList = productsResponses.list;

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductRating)
    private readonly productRatingRepository: Repository<ProductRating>,
  ) {
    super(productRepository);
  }

  /**
   * Get all Products with pagination
   * @param {InfinityScrollInput} query - query parameters for pagination
   * @returns {Promise<Product[]>}
   */
  async findAll(query: InfinityScrollInput): Promise<Product[]> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const order = query.order || 'DESC';
    const orderBy = query.orderBy || 'creation_date';
    const subQuery = this.createQueryBuilder('sub')
      .select('sub.id')
      .where('sub.status <> :status', { status: StatusEnum.DELETED })
      .orderBy(`sub.${orderBy}`, order)
      .limit(limit)
      .offset(skip);
    return await this.getQueryRelations(this.createQueryBuilder('p'))
      .where(`p.id IN (${subQuery.getQuery()})`)
      .setParameters(subQuery.getParameters())
      .orderBy(`p.${orderBy}`, order)
      .getMany();
  }

  /**
   * Find a product by its ID.
   * @param {number} id - The ID of the product to find.
   * @returns {Promise<Product>} The found product.
   */
  async findOne(id: number): Promise<Product> {
    try {
      return await this.findOneWithOptionsOrFail({
        where: { id, status: Not(StatusEnum.DELETED) },
      });
    } catch (error: unknown) {
      LogError(this.logger, error as Error, this.findOne.name);
      throw new NotFoundException(this.rList.notFound);
    }
  }

  /**
   * Find a product by its ID and business ID.
   * @param {number} id - The ID of the product to find.
   * @param {number} businessId - The ID of the business to find.
   * @returns {Promise<Product>} The found product.
   */
  async findOneByBusinessId(id: number, businessId: number): Promise<Product> {
    try {
      return await this.findOneWithOptionsOrFail({
        where: {
          id,
          idCreationBusiness: businessId,
          status: Not(StatusEnum.DELETED),
        },
      });
    } catch (error: unknown) {
      LogError(this.logger, error as Error, this.findOneByBusinessId.name);
      throw new NotFoundException(this.rList.notFound);
    }
  }

  /**
   * Find products by IDs with relations. Returns only found ones; ignores missing/deleted.
   * Uses repository.find when query builder returns empty (avoids parameter/join issues).
   * @param {number[]} ids - Product IDs to fetch.
   * @returns {Promise<Product[]>} Array of found products.
   */
  async findManyWithRelations(ids: number[]): Promise<Product[]> {
    if (!ids?.length) return [];
    const uniqueIds = [...new Set(ids)];
    let products = await this.getQueryRelations(this.createQueryBuilder('p'))
      .where('p.id IN (:...ids)', { ids: uniqueIds })
      .andWhere('p.status <> :status', { status: StatusEnum.DELETED })
      .getMany();
    if (products.length === 0) {
      products = await this.find({
        where: { id: In(uniqueIds), status: Not(StatusEnum.DELETED) },
        relations: [
          'productFiles',
          'productFiles.file',
          'catalog',
          'catalog.image',
          'business',
          'business.image',
          'business.locations',
          'variations',
          'skus',
          'skus.currency',
          'productTags',
          'productTags.tag',
        ],
      });
    }
    return products;
  }

  /**
   * Find a product by its ID with relations.
   * @param {number} id - The ID of the product to find.
   * @returns {Promise<Product>} The found product.
   */
  async findOneWithRelations(id: number): Promise<Product> {
    try {
      return await this.getQueryRelations(this.createQueryBuilder('p'))
        .where('p.id = :id', { id })
        .andWhere('p.status <> :status', { status: StatusEnum.DELETED })
        .getOneOrFail();
    } catch (error: unknown) {
      LogError(this.logger, error as Error, this.findOneWithRelations.name);
      throw new NotFoundException(this.rList.notFound);
    }
  }

  /**
   * Get all Products by Catalog
   * @param {number} idCatalog - The ID of the catalog
   * @param {string} search - search query
   * @returns {Promise<Product[]>}
   */
  async getAllByCatalog(
    idCatalog: number,
    search?: string,
  ): Promise<Product[]> {
    const subQuery = this.createQueryBuilder('sub')
      .select('sub.id')
      .where('sub.status <> :status', { status: StatusEnum.DELETED })
      .andWhere('sub.idCatalog = :idCatalog', { idCatalog });

    const trimmedSearch = search?.trim();
    if (trimmedSearch) {
      const normalizedSearch = `%${trimmedSearch}%`;
      subQuery.andWhere(
        new Brackets((queryBuilder) => {
          queryBuilder
            .where(
              `translate(lower(coalesce(sub.title, '')), 'áéíóúäëïöüñ', 'aeiouaeioun') ILIKE translate(lower(:search), 'áéíóúäëïöüñ', 'aeiouaeioun')`,
              { search: normalizedSearch },
            )
            .orWhere(
              `translate(lower(coalesce(sub.subtitle, '')), 'áéíóúäëïöüñ', 'aeiouaeioun') ILIKE translate(lower(:search), 'áéíóúäëïöüñ', 'aeiouaeioun')`,
              { search: normalizedSearch },
            )
            .orWhere(
              `translate(lower(coalesce(sub.description, '')), 'áéíóúäëïöüñ', 'aeiouaeioun') ILIKE translate(lower(:search), 'áéíóúäëïöüñ', 'aeiouaeioun')`,
              { search: normalizedSearch },
            );
        }),
      );
    }

    const queryBuilder = this.getQueryRelations(this.createQueryBuilder('p'))
      .where(`p.id IN (${subQuery.getQuery()})`)
      .setParameters(subQuery.getParameters());
    if (!trimmedSearch) {
      queryBuilder.orderBy('p.creationDate', 'DESC').addOrderBy('p.id', 'DESC');
    }
    return await queryBuilder.getMany();
  }

  /**
   * Get all Products by Catalog with pagination
   * @param {number} idCatalog - The ID of the catalog
   * @param {InfinityScrollInput} query - query parameters for pagination
   * @returns {Promise<Product[]>}
   */
  async getAllByCatalogPaginated(
    idCatalog: number,
    query: InfinityScrollInput,
  ): Promise<Product[]> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const order = query.order || 'DESC';
    const orderBy = query.orderBy || 'creation_date';
    const search = query.search?.trim();
    const subQuery = this.createQueryBuilder('sub')
      .select('sub.id')
      .where('sub.status <> :status', { status: StatusEnum.DELETED })
      .andWhere('sub.idCatalog = :idCatalog', { idCatalog });

    const trimmedSearch = search;
    if (trimmedSearch) {
      const normalizedSearch = `%${trimmedSearch}%`;
      subQuery.andWhere(
        new Brackets((queryBuilder) => {
          queryBuilder
            .where(
              `translate(lower(coalesce(sub.title, '')), 'áéíóúäëïöüñ', 'aeiouaeioun') ILIKE translate(lower(:search), 'áéíóúäëïöüñ', 'aeiouaeioun')`,
              { search: normalizedSearch },
            )
            .orWhere(
              `translate(lower(coalesce(sub.subtitle, '')), 'áéíóúäëïöüñ', 'aeiouaeioun') ILIKE translate(lower(:search), 'áéíóúäëïöüñ', 'aeiouaeioun')`,
              { search: normalizedSearch },
            )
            .orWhere(
              `translate(lower(coalesce(sub.description, '')), 'áéíóúäëïöüñ', 'aeiouaeioun') ILIKE translate(lower(:search), 'áéíóúäëïöüñ', 'aeiouaeioun')`,
              { search: normalizedSearch },
            );
        }),
      );
    }
    subQuery.orderBy(`sub.${orderBy}`, order).limit(limit).offset(skip);
    return await this.getQueryRelations(this.createQueryBuilder('p'))
      .where(`p.id IN (${subQuery.getQuery()})`)
      .setParameters(subQuery.getParameters())
      .orderBy(`p.${orderBy}`, order)
      .getMany();
  }

  /**
   * Get all Products by Business with pagination
   * @param {number} idBusiness - The ID of the business
   * @param {InfinityScrollInput} query - query parameters for pagination
   * @returns {Promise<Product[]>}
   */
  async findAllByBusiness(
    idBusiness: number,
    query: InfinityScrollInput,
    onlyDraft?: boolean,
  ): Promise<Product[]> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const order = query.order || 'DESC';
    const orderBy = query.orderBy || 'creation_date';
    const search = query.search?.trim() || null;
    const subQuery = this.createQueryBuilder('sub')
      .select('sub.id')
      .where('sub.status <> :status', { status: StatusEnum.DELETED })
      .andWhere('sub.idCreationBusiness = :idBusiness', { idBusiness })
      .orderBy(`sub.${orderBy}`, order);
    if (onlyDraft) {
      subQuery.andWhere('sub.idCatalog IS NULL OR sub.status = :status', {
        status: StatusEnum.PENDING,
      });
    }
    if (search) {
      const normalizedSearch = `%${search}%`;
      subQuery.andWhere(
        new Brackets((queryBuilder) => {
          queryBuilder
            .where(
              `translate(lower(coalesce(sub.title, '')), 'áéíóúäëïöüñ', 'aeiouaeioun') ILIKE translate(lower(:search), 'áéíóúäëïöüñ', 'aeiouaeioun')`,
              { search: normalizedSearch },
            )
            .orWhere(
              `translate(lower(coalesce(sub.subtitle, '')), 'áéíóúäëïöüñ', 'aeiouaeioun') ILIKE translate(lower(:search), 'áéíóúäëïöüñ', 'aeiouaeioun')`,
              { search: normalizedSearch },
            )
            .orWhere(
              `translate(lower(coalesce(sub.description, '')), 'áéíóúäëïöüñ', 'aeiouaeioun') ILIKE translate(lower(:search), 'áéíóúäëïöüñ', 'aeiouaeioun')`,
              { search: normalizedSearch },
            );
        }),
      );
    }
    subQuery.limit(limit).offset(skip);
    return await this.getQueryRelations(this.createQueryBuilder('p'))
      .where(`p.id IN (${subQuery.getQuery()})`)
      .setParameters(subQuery.getParameters())
      .orderBy(`p.${orderBy}`, order)
      .getMany();
  }

  /**
   * Get products by business and primary flag.
   * @param {GetAllPrimaryProductsByBusinessInput} data - The data for the input.
   * @param {boolean} isPrimary - Primary flag filter.
   * @returns {Promise<Product[]>} Array of matching products.
   */
  async findAllByBusinessAndIsPrimary(
    data: GetAllPrimaryProductsByBusinessInput,
    isPrimary: boolean,
  ): Promise<Product[]> {
    const { idBusiness, idCatalog } = data;
    const queryBuilder = this.getQueryRelations(this.createQueryBuilder('p'))
      .where('p.idCreationBusiness = :idBusiness', { idBusiness })
      .andWhere('p.isPrimary = :isPrimary', { isPrimary })
      .andWhere('p.status <> :status', { status: StatusEnum.DELETED });
    if (idCatalog !== undefined && idCatalog !== null) {
      queryBuilder.andWhere('p.idCatalog = :idCatalog', { idCatalog });
    }
    return await queryBuilder.orderBy('p.creationDate', 'DESC').getMany();
  }

  /**
   * Get all product IDs by business (for discount assignment).
   * @param {number} idBusiness - The business ID.
   * @returns {Promise<number[]>} Array of product IDs.
   */
  async findProductIdsByBusiness(idBusiness: number): Promise<number[]> {
    const products = await this.createQueryBuilder('p')
      .select('p.id')
      .where('p.idCreationBusiness = :idBusiness', { idBusiness })
      .andWhere('p.status <> :status', { status: StatusEnum.DELETED })
      .getMany();
    return products.map((p) => p.id);
  }

  /**
   * Get all Products by tag (name or slug) with pagination.
   * @param {string} tagNameOrSlug - Tag name or slug to filter by.
   * @param {InfinityScrollInput} query - Query parameters for pagination.
   * @param {number} idBusiness - Optional business ID filter.
   * @param {number[]} idProducts - Optional product IDs to exclude.
   * @returns {Promise<Product[]>} Array of products with the given tag.
   */
  async findAllByTag(
    tagNameOrSlug: string,
    query: InfinityScrollInput,
    idBusiness?: number,
    idProducts?: number[],
  ): Promise<Product[]> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const order = query.order || 'DESC';
    const orderBy = query.orderBy || 'creation_date';
    const subQuery = this.createQueryBuilder('sub')
      .select('sub.id')
      .innerJoin('sub.productTags', 'pt')
      .innerJoin('pt.tag', 'tag')
      .where('sub.status <> :status', { status: StatusEnum.DELETED })
      .andWhere('(tag.name = :tagNameOrSlug OR tag.slug = :tagNameOrSlug)', {
        tagNameOrSlug,
      });
    if (idBusiness !== undefined && idBusiness !== null) {
      subQuery.andWhere('sub.idCreationBusiness = :idBusiness', { idBusiness });
    }
    if (idProducts && idProducts.length > 0) {
      subQuery.andWhere('sub.id NOT IN (:...idProducts)', { idProducts });
    }
    subQuery.orderBy(`sub.${orderBy}`, order).limit(limit).offset(skip);
    return await this.getQueryRelations(this.createQueryBuilder('p'))
      .where(`p.id IN (${subQuery.getQuery()})`)
      .setParameters(subQuery.getParameters())
      .orderBy(`p.${orderBy}`, order)
      .getMany();
  }

  /**
   * Get all Products by multiple tags (name or slug) with pagination.
   * Returns products that have at least one of the specified tags.
   * @param {string[]} tagNamesOrSlugs - Tag names or slugs to filter by.
   * @param {InfinityScrollInput} query - Query parameters for pagination.
   * @param {number} idBusiness - Optional business ID filter.
   * @param {number[]} idProducts - Optional product IDs to exclude.
   * @returns {Promise<Product[]>} Array of products matching any of the given tags.
   */
  async findAllByTags(
    tagNamesOrSlugs: string[],
    query: InfinityScrollInput,
    idBusiness?: number,
    idProducts?: number[],
  ): Promise<Product[]> {
    if (!tagNamesOrSlugs?.length) return [];
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const order = query.order || 'DESC';
    const orderBy = query.orderBy || 'creation_date';
    const subQuery = this.createQueryBuilder('sub')
      .select('sub.id')
      .innerJoin('sub.productTags', 'pt')
      .innerJoin('pt.tag', 'tag')
      .where('sub.status <> :status', { status: StatusEnum.DELETED })
      .andWhere(
        '(tag.name IN (:...tagNamesOrSlugs) OR tag.slug IN (:...tagNamesOrSlugs))',
        {
          tagNamesOrSlugs,
        },
      );
    if (idBusiness !== undefined && idBusiness !== null) {
      subQuery.andWhere('sub.idCreationBusiness = :idBusiness', { idBusiness });
    }
    if (idProducts && idProducts.length > 0) {
      subQuery.andWhere('sub.id NOT IN (:...idProducts)', { idProducts });
    }
    subQuery.orderBy(`sub.${orderBy}`, order).limit(limit).offset(skip);
    return await this.getQueryRelations(this.createQueryBuilder('p'))
      .where(`p.id IN (${subQuery.getQuery()})`)
      .setParameters(subQuery.getParameters())
      .orderBy(`p.${orderBy}`, order)
      .getMany();
  }

  /**
   * Gets product IDs by tag IDs, in random order.
   * Excludes deleted products, catalogs, and businesses.
   * @param {number[]} tagIds - Tag IDs to filter by.
   * @param {number} limit - Max number of product IDs to return.
   * @returns {Promise<number[]>} Array of product IDs.
   */
  async findProductIdsByTagIds(
    tagIds: number[],
    limit: number,
  ): Promise<number[]> {
    if (tagIds.length === 0) return [];
    const rows = await this.createQueryBuilder('p')
      .innerJoin('p.productTags', 'pt')
      .innerJoin('pt.tag', 't', 't.id IN (:...tagIds)', { tagIds })
      .innerJoin('p.catalog', 'c', 'c.status <> :catalogStatus', {
        catalogStatus: StatusEnum.DELETED,
      })
      .innerJoin('p.business', 'b', 'b.status <> :businessStatus', {
        businessStatus: StatusEnum.DELETED,
      })
      .where('p.status <> :productStatus', {
        productStatus: StatusEnum.DELETED,
      })
      .select('p.id', 'id')
      .orderBy('RANDOM()')
      .limit(limit)
      .getRawMany<{ id: string }>();
    return (rows ?? [])
      .map((r) => Number(r?.id))
      .filter((id): id is number => !Number.isNaN(id));
  }

  /**
   * Get all product IDs by catalog (for discount assignment).
   * @param {number} idCatalog - The catalog ID.
   * @returns {Promise<number[]>} Array of product IDs.
   */
  async findProductIdsByCatalog(idCatalog: number): Promise<number[]> {
    const products = await this.createQueryBuilder('p')
      .select('p.id')
      .where('p.idCatalog = :idCatalog', { idCatalog })
      .andWhere('p.status <> :status', { status: StatusEnum.DELETED })
      .getMany();
    return products.map((p) => p.id);
  }

  /**
   * Get top products by rating for statistics.
   * @param {number} idBusiness - The ID of the business.
   * @param {number} limit - The limit of the top products.
   * @returns {Promise<{ id: number; title: string; ratingAverage: number }[]>} The top products by rating.
   */
  async getTopByRatingForStatistics(
    idBusiness: number,
    limit: number,
  ): Promise<IStatItemWithRating[]> {
    return await this.createQueryBuilder('p')
      .select(['p.id', 'p.title', 'p.ratingAverage'])
      .where('p.id_creation_business = :idBusiness', { idBusiness })
      .andWhere('p.status <> :status', { status: StatusEnum.DELETED })
      .andWhere('p.rating_average > 0')
      .orderBy('p.rating_average', 'DESC')
      .limit(limit)
      .getMany()
      .then((list) =>
        list.map((p) => ({
          id: p.id,
          title: p.title,
          ratingAverage: Number(p.ratingAverage),
        })),
      );
  }

  /**
   * Get top products by likes for statistics.
   *
   * @param {number} idBusiness - The ID of the business.
   * @param {number} limit - The limit of the top products.
   * @returns {Promise<{ id: number; title: string; likes: number }[]>} The top products by likes.
   */
  async getTopByLikesForStatistics(
    idBusiness: number,
    limit: number,
  ): Promise<IStatItemWithLikes[]> {
    return await this.createQueryBuilder('p')
      .select(['p.id', 'p.title', 'p.likes'])
      .where('p.id_creation_business = :idBusiness', { idBusiness })
      .andWhere('p.status <> :status', { status: StatusEnum.DELETED })
      .andWhere('p.likes > 0')
      .orderBy('p.likes', 'DESC')
      .limit(limit)
      .getMany()
      .then((list) =>
        list.map((p) => ({ id: p.id, title: p.title, likes: Number(p.likes) })),
      );
  }

  /**
   * Count products without visits for statistics.
   *
   * @param {number} idBusiness - The ID of the business.
   * @returns {Promise<number>} The count of products without visits.
   */
  async getWithoutVisitsCountForStatistics(
    idBusiness: number,
  ): Promise<number> {
    return await this.createQueryBuilder('p')
      .where('p.id_creation_business = :idBusiness', { idBusiness })
      .andWhere('p.status <> :status', { status: StatusEnum.DELETED })
      .andWhere('p.visits = 0')
      .getCount();
  }

  /**
   * Count products without ratings for statistics.
   *
   * @param {number} idBusiness - The ID of the business.
   * @returns {Promise<number>} The count of products without ratings.
   */
  async getWithoutRatingsCountForStatistics(
    idBusiness: number,
  ): Promise<number> {
    const subQb = this.productRatingRepository
      .createQueryBuilder('pr')
      .innerJoin('pr.product', 'p2')
      .where('p2.id_creation_business = :idBusiness', { idBusiness })
      .andWhere('pr.status <> :ratingStatus', {
        ratingStatus: StatusEnum.DELETED,
      })
      .select('pr.id_product');
    return await this.createQueryBuilder('p')
      .where('p.id_creation_business = :idBusiness', { idBusiness })
      .andWhere('p.status <> :productStatus', {
        productStatus: StatusEnum.DELETED,
      })
      .andWhere(`p.id NOT IN (${subQb.getQuery()})`)
      .setParameters({
        ...subQb.getParameters(),
        productStatus: StatusEnum.DELETED,
      })
      .getCount();
  }

  /**
   * Get product IDs and total likes for statistics.
   *
   * @param {number} idBusiness - The ID of the business.
   * @returns {Promise<{ id: number }[]>} The product IDs and total likes.
   */
  async getProductIdsAndLikesForStatistics(
    idBusiness: number,
  ): Promise<{ id: number }[]> {
    return await this.find({
      where: {
        idCreationBusiness: idBusiness,
        status: Not(StatusEnum.DELETED),
      },
      select: ['id'],
    });
  }

  /**
   * Get total likes sum for product IDs.
   *
   * @param {number[]} productIds - The product IDs.
   * @returns {Promise<number>} The total likes.
   */
  async getTotalLikesByProductIds(productIds: number[]): Promise<number> {
    if (productIds.length === 0) return 0;
    const result = await this.createQueryBuilder('p')
      .where('p.id IN (:...productIds)', { productIds })
      .select('COALESCE(SUM(p.likes), 0)', 'total')
      .getRawOne<{ total: string }>();
    return parseInt(result?.total ?? '0', 10);
  }

  /**
   * Get top products by visits (merges product visit data with product info).
   * @param {IGetTopByVisitsForStatisticsInput} input - The visit data and business ID.
   * @returns {Promise<IStatItemWithVisits[]>} The top products by visits.
   */
  async getTopByVisitsForStatistics(
    input: IGetTopByVisitsForStatisticsInput,
  ): Promise<IStatItemWithVisits[]> {
    const { visitData, idBusiness } = input;
    if (visitData.length === 0) return [];
    const productIds = visitData.map((v) => Number(v.idProduct));
    const products = await this.productRepository.find({
      where: {
        id: In(productIds),
        idCreationBusiness: idBusiness,
        status: Not(StatusEnum.DELETED),
      },
      select: ['id', 'title'],
    });
    const visitMap = new Map(
      visitData.map((v) => [Number(v.idProduct), v.visits] as const),
    );
    return products
      .map((p) => {
        const id = Number(p.id);
        return {
          id,
          title: p.title,
          visits: visitMap.get(id) ?? 0,
        };
      })
      .sort((a, b) => b.visits - a.visits);
  }

  /**
   * Count products without stock for statistics.
   *
   * @param {number} idBusiness - The ID of the business.
   * @returns {Promise<number>} The count of products without stock.
   */
  async getWithoutStockCountForStatistics(idBusiness: number): Promise<number> {
    const products = await this.createQueryBuilder('p')
      .leftJoin('p.skus', 'skus', 'skus.status <> :skuStatus', {
        skuStatus: StatusEnum.DELETED,
      })
      .where('p.id_creation_business = :idBusiness', { idBusiness })
      .andWhere('p.status <> :productStatus', {
        productStatus: StatusEnum.DELETED,
      })
      .select('p.id')
      .addSelect(
        'SUM(CASE WHEN skus.quantity IS NULL THEN 1 ELSE 0 END)',
        'nullCount',
      )
      .addSelect('COUNT(skus.id)', 'skuCount')
      .groupBy('p.id')
      .getRawMany<{ id: number; nullCount: string; skuCount: string }>();
    let count = 0;
    for (const row of products) {
      const skuCount = parseInt(row.skuCount ?? '0', 10);
      const nullCount = parseInt(row.nullCount ?? '0', 10);
      if (skuCount === 0 || (skuCount > 0 && nullCount === skuCount)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Counts non-deleted products platform-wide (admin statistics).
   * @returns {Promise<number>} Product count.
   */
  async getNonDeletedProductsCountForAdminStatistics(): Promise<number> {
    return this.productRepository.count({
      where: { status: Not(StatusEnum.DELETED) },
    });
  }

  /**
   * Products with no SKUs or only null quantities on all non-deleted SKUs (admin, global).
   * @returns {Promise<number>} Product count.
   */
  async getGlobalProductsWithoutStockCountForAdminStatistics(): Promise<number> {
    const rows = await this.createQueryBuilder('p')
      .leftJoin('p.skus', 'skus', 'skus.status <> :skuStatus', {
        skuStatus: StatusEnum.DELETED,
      })
      .where('p.status <> :productStatus', {
        productStatus: StatusEnum.DELETED,
      })
      .select('p.id', 'id')
      .addSelect(
        'SUM(CASE WHEN skus.quantity IS NULL THEN 1 ELSE 0 END)',
        'nullCount',
      )
      .addSelect('COUNT(skus.id)', 'skuCount')
      .groupBy('p.id')
      .getRawMany<{ id: number; nullCount: string; skuCount: string }>();
    let count = 0;
    for (const row of rows) {
      const skuCount = parseInt(row.skuCount ?? '0', 10);
      const nullCount = parseInt(row.nullCount ?? '0', 10);
      if (skuCount === 0 || (skuCount > 0 && nullCount === skuCount)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Apply common relations to a product query builder
   * @param {SelectQueryBuilder<Product>} queryBuilder - The query builder to apply relations to
   * @returns {SelectQueryBuilder<Product>} The query builder with relations applied
   */
  private getQueryRelations(
    queryBuilder: SelectQueryBuilder<Product>,
  ): SelectQueryBuilder<Product> {
    return queryBuilder
      .leftJoinAndSelect(
        'p.productFiles',
        'productFiles',
        'productFiles.status <> :statusProductFile',
        { statusProductFile: StatusEnum.DELETED },
      )
      .leftJoinAndSelect('productFiles.file', 'file')
      .leftJoinAndSelect('p.catalog', 'catalog')
      .leftJoinAndSelect('catalog.image', 'imageCatalog')
      .leftJoinAndSelect('p.business', 'business')
      .leftJoinAndSelect('business.image', 'imageBusiness')
      .leftJoinAndSelect(
        'business.locations',
        'locations',
        'locations.status <> :statusLocation',
        { statusLocation: StatusEnum.DELETED },
      )
      .leftJoinAndSelect(
        'p.variations',
        'variations',
        'variations.status <> :statusVariations',
        { statusVariations: StatusEnum.DELETED },
      )
      .leftJoinAndSelect('p.skus', 'skus', 'skus.status <> :statusSkus', {
        statusSkus: StatusEnum.DELETED,
      })
      .leftJoinAndSelect('skus.currency', 'currency')
      .leftJoinAndSelect(
        'p.reactions',
        'reactions',
        'reactions.status <> :statusReaction',
        { statusReaction: StatusEnum.DELETED },
      )
      .leftJoinAndSelect('p.discountProduct', 'discountProduct')
      .leftJoinAndSelect(
        'discountProduct.discount',
        'discount',
        'discount.status = :statusDiscount',
        { statusDiscount: StatusEnum.ACTIVE },
      )
      .leftJoinAndSelect('discount.currency', 'discountCurrency')
      .leftJoinAndSelect('p.productTags', 'productTags')
      .leftJoinAndSelect('productTags.tag', 'tag');
  }
}
