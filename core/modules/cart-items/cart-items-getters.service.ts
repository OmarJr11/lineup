import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BasicService } from '../../common/services';
import { cartItemsResponses } from '../../common/responses';
import { CartItem } from '../../entities';

/** Provides read operations for cart items. */
@Injectable()
export class CartItemsGettersService extends BasicService<CartItem> {
  private readonly logger = new Logger(CartItemsGettersService.name);
  private readonly rList = cartItemsResponses.list;

  /**
   * Creates a cart item getter service.
   * @param {Repository<CartItem>} cartItemRepository - Cart item repository.
   */
  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
  ) {
    super(cartItemRepository);
  }

  /**
   * Finds a cart item and loads its related cart, product, and SKU.
   * @param {number} cartItemId - Cart item identifier.
   * @returns {Promise<CartItem | null>} The matching item or null.
   */
  async findById(cartItemId: number): Promise<CartItem | null> {
    try {
      return await this.createQueryBuilderForCartItem()
        .where('cartItem.id = :cartItemId', { cartItemId })
        .getOne();
    } catch (error) {
      this.logger.error(error, this.findById.name);
      throw new InternalServerErrorException(this.rList.error);
    }
  }

  /**
   * Finds an item using its product, SKU, and variation combination.
   * @param {number} cartId - Parent cart identifier.
   * @param {number} productId - Product identifier.
   * @param {number | undefined} productSkuId - Optional SKU identifier.
   * @param {Record<string, string> | undefined} variationOptions - Optional variation values.
   * @returns {Promise<CartItem | null>} The matching item or null.
   */
  async findExisting(
    cartId: number,
    productId: number,
    productSkuId?: number,
    variationOptions?: Record<string, string>,
  ): Promise<CartItem | null> {
    try {
      const query = this.createQueryBuilder('cartItem')
        .where('cartItem.idCart = :cartId', { cartId })
        .andWhere('cartItem.idProduct = :productId', { productId });

      if (productSkuId) {
        query.andWhere('cartItem.idProductSku = :productSkuId', {
          productSkuId,
        });
      } else {
        query.andWhere('cartItem.idProductSku IS NULL');
      }

      if (variationOptions && Object.keys(variationOptions).length > 0) {
        query.andWhere('cartItem.variationOptions = :variationOptions', {
          variationOptions: JSON.stringify(variationOptions),
        });
      } else {
        query.andWhere('cartItem.variationOptions IS NULL');
      }

      return await query.getOne();
    } catch (error) {
      this.logger.error(error, this.findExisting.name);
      throw new InternalServerErrorException(this.rList.error);
    }
  }

  /**
   * Returns cart items ordered from newest to oldest.
   * @param {number} cartId - Parent cart identifier.
   * @returns {Promise<CartItem[]>} Items belonging to the cart.
   */
  async findByCartId(cartId: number): Promise<CartItem[]> {
    try {
      return await this.createQueryBuilderForCartItem()
        .where('cartItem.idCart = :cartId', { cartId })
        .orderBy('cartItem.creation_date', 'DESC')
        .getMany();
    } catch (error) {
      this.logger.error(error, this.findByCartId.name);
      throw new InternalServerErrorException(this.rList.error);
    }
  }

  /**
   * Aggregates the cart item subtotals and quantities.
   * @param {number} cartId - Parent cart identifier.
   * @returns {Promise<{ total: number; itemsCount: number }>} Cart totals.
   */
  async calculateCartTotal(
    cartId: number,
  ): Promise<{ total: number; itemsCount: number }> {
    try {
      const result = await this.createQueryBuilder('cartItem')
        .select('COALESCE(SUM(cartItem.subtotal), 0)', 'total')
        .addSelect('COALESCE(SUM(cartItem.quantity), 0)', 'itemsCount')
        .where('cartItem.idCart = :cartId', { cartId })
        .getRawOne<{ total: string; itemsCount: string }>();

      return {
        total: Number(result?.total ?? 0),
        itemsCount: Number(result?.itemsCount ?? 0),
      };
    } catch (error) {
      this.logger.error(error, this.calculateCartTotal.name);
      throw new InternalServerErrorException(this.rList.error);
    }
  }

  /**
   * Creates a query builder with the cart item relations required by callers.
   * @returns {SelectQueryBuilder<CartItem>} Cart item query builder.
   */
  private createQueryBuilderForCartItem(): SelectQueryBuilder<CartItem> {
    return this.createQueryBuilder('cartItem')
      .leftJoinAndSelect('cartItem.cart', 'cart')
      .leftJoinAndSelect('cartItem.product', 'product')
      .leftJoinAndSelect('cartItem.productSku', 'productSku');
  }
}
