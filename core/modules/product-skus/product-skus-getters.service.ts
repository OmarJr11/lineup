import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { InfinityScrollInput } from '../../common/dtos';
import { StatusEnum } from '../../common/enums';
import { LogError } from '../../common/helpers/logger.helper';
import { productSkusResponses } from '../../common/responses';
import { ProductSku } from '../../entities';

/**
 * Read-only service for querying product SKUs.
 */
@Injectable()
export class ProductSkusGettersService extends BasicService<ProductSku> {
  private readonly logger = new Logger(ProductSkusGettersService.name);
  private readonly rList = productSkusResponses.list;
  private readonly relations = ['product', 'business', 'currency'];

  constructor(
    @InjectRepository(ProductSku)
    private readonly productSkuRepository: Repository<ProductSku>,
  ) {
    super(productSkuRepository);
  }

  /**
   * Find a product SKU by its ID.
   * @param {number} id - The ID of the product SKU to find.
   * @returns {Promise<ProductSku>} The found product SKU.
   */
  async findOne(id: number): Promise<ProductSku> {
    try {
      return await this.findOneWithOptionsOrFail({
        where: { id, status: Not(StatusEnum.DELETED) },
      });
    } catch (error) {
      LogError(this.logger, error, this.findOne.name);
      throw new NotFoundException(this.rList.notFound);
    }
  }

  /**
   * Find a product SKU by its ID with relations.
   * @param {number} id - The ID of the product SKU to find.
   * @returns {Promise<ProductSku>} The found product SKU.
   */
  async findOneWithRelations(id: number): Promise<ProductSku> {
    try {
      return await this.findOneWithOptionsOrFail({
        where: { id, status: Not(StatusEnum.DELETED) },
        relations: this.relations,
      });
    } catch (error) {
      LogError(this.logger, error, this.findOneWithRelations.name);
      throw new NotFoundException(this.rList.notFound);
    }
  }

  /**
   * Find all product SKUs by product ID.
   * @param {number} idProduct - The product ID.
   * @returns {Promise<ProductSku[]>} Array of product SKUs.
   */
  async findAllByProduct(idProduct: number): Promise<ProductSku[]> {
    return await this.createQueryBuilder('ps')
      .leftJoinAndSelect('ps.product', 'product')
      .where('ps.idProduct = :idProduct', { idProduct })
      .andWhere('ps.status <> :status', { status: StatusEnum.DELETED })
      .orderBy('ps.id', 'ASC')
      .getMany();
  }

  /**
   * Find all product SKUs by product ID and business ID (validates ownership).
   * @param {number} idProduct - The product ID.
   * @param {number} idBusiness - The business ID.
   * @returns {Promise<ProductSku[]>} Array of product SKUs.
   */
  async findAllByProductAndBusiness(
    idProduct: number,
    idBusiness: number,
  ): Promise<ProductSku[]> {
    return await this.createQueryBuilder('ps')
      .leftJoinAndSelect('ps.product', 'product')
      .leftJoinAndSelect('ps.currency', 'currency')
      .where('ps.idProduct = :idProduct', { idProduct })
      .andWhere('ps.idCreationBusiness = :idBusiness', { idBusiness })
      .andWhere('ps.status <> :status', { status: StatusEnum.DELETED })
      .orderBy('ps.id', 'ASC')
      .getMany();
  }

  /**
   * Find a product SKU by ID and business ID (validates ownership).
   * @param {number} id - The SKU ID.
   * @param {number} idBusiness - The business ID.
   * @returns {Promise<ProductSku>} The found product SKU.
   */
  async findOneByBusinessId(
    id: number,
    idBusiness: number,
  ): Promise<ProductSku> {
    try {
      return await this.findOneWithOptionsOrFail({
        where: {
          id,
          idCreationBusiness: idBusiness,
          status: Not(StatusEnum.DELETED),
        },
        relations: this.relations,
      });
    } catch (error) {
      LogError(this.logger, error, this.findOneByBusinessId.name);
      throw new NotFoundException(this.rList.notFound);
    }
  }

  /**
   * Count SKUs with low or out-of-stock for statistics.
   *
   * @param {number} idBusiness - The business ID.
   * @param {number} threshold - The threshold for low or out-of-stock.
   * @returns {Promise<number>} The count of SKUs with low or out-of-stock.
   */
  async getLowOrOutOfStockCountForStatistics(
    idBusiness: number,
    threshold: number = 5,
  ): Promise<number> {
    return await this.createQueryBuilder('ps')
      .where('ps.id_creation_business = :idBusiness', { idBusiness })
      .andWhere('ps.status <> :status', { status: StatusEnum.DELETED })
      .andWhere('(ps.quantity IS NULL OR ps.quantity <= :threshold)', {
        threshold,
      })
      .getCount();
  }

  /**
   * Get total stock (sum of quantity) for a product.
   * @param {number} idProduct - The product ID.
   * @returns {Promise<number>} Total quantity across all SKUs.
   */
  async getTotalStockByProduct(idProduct: number): Promise<number> {
    const result = await this.createQueryBuilder('ps')
      .select('COALESCE(SUM(ps.quantity), 0)', 'total')
      .where('ps.idProduct = :idProduct', { idProduct })
      .andWhere('ps.status <> :status', { status: StatusEnum.DELETED })
      .getRawOne();
    return parseInt(result?.total ?? '0', 10);
  }

  /**
   * Counts non-deleted SKUs linked to non-deleted products (admin statistics).
   * @returns {Promise<number>} SKU count.
   */
  async getActiveSkusForNonDeletedProductsCountForAdminStatistics(): Promise<number> {
    return this.createQueryBuilder('s')
      .innerJoin('s.product', 'p')
      .where('s.status <> :skuStatus', { skuStatus: StatusEnum.DELETED })
      .andWhere('p.status <> :productStatus', {
        productStatus: StatusEnum.DELETED,
      })
      .getCount();
  }
}
