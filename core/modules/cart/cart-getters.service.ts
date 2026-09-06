import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Cart, CartItem } from '../../entities';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BasicService } from '../../common/services';
import { cartsResponses } from '../../common/responses';
import { CartItemsService } from '../cart-items/cart-items.service';

@Injectable()
/** Provides read operations for carts and delegates cart item reads to CartItemsService. */
export class CartGettersService extends BasicService<Cart> {
  private readonly logger = new Logger(CartGettersService.name);
  private readonly rList = cartsResponses.list;
  /** Relations loaded when returning a cart through the GraphQL API. */
  private readonly _relations = [
    'items',
    'items.product',
    'items.product.productFiles',
    'items.product.productFiles.file',
    'items.product.catalog',
    'items.product.catalog.image',
    'items.product.business',
    'items.product.business.image',
    'items.product.business.locations',
    'items.product.variations',
    'items.product.skus',
    'items.product.skus.currency',
    'items.product.productTags',
    'items.product.productTags.tag',
    'items.productSku',
    'items.productSku.currency',
    'business',
    'business.image',
    'business.locations',
    'user',
    'user.profileImage',
  ];

  /** Cart repository and cart item service dependencies. */
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    private readonly cartItemsService: CartItemsService,
  ) {
    super(cartRepository);
  }

  /**
   * Finds a cart by user and business and loads its related entities.
   * @param {number} userId - Cart owner identifier.
   * @param {number} businessId - Business identifier.
   * @returns {Promise<Cart | null>} The matching cart or null.
   */
  async getCartByUserAndBusiness(
    userId: number,
    businessId: number,
  ): Promise<Cart | null> {
    const cart = await this.createQueryBuilderForCart()
      .where('cart.idCreationUser = :userId', { userId })
      .andWhere('cart.idBusiness = :businessId', { businessId })
      .orderBy('cartItem.creation_date', 'DESC')
      .getOne();

    return cart;
  }

  /**
   * Finds a cart by its identifier.
   * @param {number} cartId - Cart identifier.
   * @returns {Promise<Cart | null>} The matching cart or null.
   */
  async getCartById(cartId: number): Promise<Cart | null> {
    return await this.createQueryBuilderForCart()
      .where('cart.id = :cartId', { cartId })
      .orderBy('cartItem.creation_date', 'DESC')
      .getOne();
  }

  /**
   * Finds a cart item by its identifier.
   * @param {number} cartItemId - Cart item identifier.
   * @returns {Promise<CartItem | null>} The matching item or null.
   */
  async getCartItemById(cartItemId: number): Promise<CartItem | null> {
    return await this.cartItemsService.findById(cartItemId);
  }

  /**
   * Finds an existing cart item using its product selection.
   * @param {number} cartId - Parent cart identifier.
   * @param {number} productId - Product identifier.
   * @param {number | undefined} productSkuId - Optional SKU identifier.
   * @param {Record<string, string> | undefined} variationOptions - Optional variation values.
   * @returns {Promise<CartItem | null>} The matching item or null.
   */
  async findExistingCartItem(
    cartId: number,
    productId: number,
    productSkuId?: number,
    variationOptions?: Record<string, string>,
  ): Promise<CartItem | null> {
    return await this.cartItemsService.findExisting(
      cartId,
      productId,
      productSkuId,
      variationOptions,
    );
  }

  /**
   * Returns all items belonging to a cart.
   * @param {number} cartId - Parent cart identifier.
   * @returns {Promise<CartItem[]>} Cart items ordered by creation date.
   */
  async getCartItems(cartId: number): Promise<CartItem[]> {
    return await this.cartItemsService.findByCartId(cartId);
  }

  /**
   * Calculates the total value and quantity of a cart.
   * @param {number} cartId - Cart identifier.
   * @returns {Promise<{ total: number; itemsCount: number }>} Calculated cart totals.
   */
  async calculateCartTotal(
    cartId: number,
  ): Promise<{ total: number; itemsCount: number }> {
    return await this.cartItemsService.calculateCartTotal(cartId);
  }

  /**
   * Returns all carts owned by a user.
   * @param {number} userId - Cart owner identifier.
   * @returns {Promise<Cart[]>} The user's carts.
   */
  async getUserCarts(userId: number): Promise<Cart[]> {
    try {
      return await this.createQueryBuilderForCart()
        .where('cart.idCreationUser = :userId', { userId })
        .orderBy('cart.lastActivityDate', 'DESC')
        .addOrderBy('cartItem.creation_date', 'DESC')
        .getMany();
    } catch (error) {
      this.logger.error(error, this.getUserCarts.name);
      throw new InternalServerErrorException(this.rList.error);
    }
  }

  /**
   * Returns all carts associated with a business.
   * @param {number} businessId - Business identifier.
   * @returns {Promise<Cart[]>} The business carts.
   */
  async getBusinessCarts(businessId: number): Promise<Cart[]> {
    try {
      return await this.createQueryBuilderForCart()
        .where('cart.idBusiness = :businessId', { businessId })
        .orderBy('cart.lastActivityDate', 'DESC')
        .addOrderBy('cartItem.creation_date', 'DESC')
        .getMany();
    } catch (error) {
      this.logger.error(error, this.getBusinessCarts.name);
      throw new InternalServerErrorException(this.rList.error);
    }
  }

  /**
   * Checks whether a cart exists for a user and business.
   * @param {number} userId - Cart owner identifier.
   * @param {number} businessId - Business identifier.
   * @returns {Promise<boolean>} True when the cart exists.
   */
  async cartExists(userId: number, businessId: number): Promise<boolean> {
    const count = await this.cartRepository.count({
      where: { idCreationUser: userId, idBusiness: businessId },
    });
    return count > 0;
  }

  /**
   * Creates query builder for cart with all relations loaded.
   * @returns {SelectQueryBuilder<Cart>} Query builder for cart.
   */
  private createQueryBuilderForCart(): SelectQueryBuilder<Cart> {
    const queryBuilder = this.createQueryBuilder('cart')
      .leftJoinAndSelect('cart.items', 'cartItem')
      .leftJoinAndSelect('cartItem.product', 'product')
      .leftJoinAndSelect('product.productFiles', 'productFile')
      .leftJoinAndSelect('productFile.file', 'productFileEntity')
      .leftJoinAndSelect('product.catalog', 'catalog')
      .leftJoinAndSelect('catalog.image', 'catalogImage')
      .leftJoinAndSelect('product.business', 'productBusiness')
      .leftJoinAndSelect('productBusiness.image', 'productBusinessImage')
      .leftJoinAndSelect('productBusiness.locations', 'productBusinessLocation')
      .leftJoinAndSelect('product.variations', 'productVariation')
      .leftJoinAndSelect('product.skus', 'productSku')
      .leftJoinAndSelect('productSku.currency', 'productSkuCurrency')
      .leftJoinAndSelect('product.productTags', 'productTag')
      .leftJoinAndSelect('productTag.tag', 'productTagEntity')
      .leftJoinAndSelect('cartItem.productSku', 'cartItemSku')
      .leftJoinAndSelect('cartItemSku.currency', 'cartItemSkuCurrency')
      .leftJoinAndSelect('cart.business', 'business')
      .leftJoinAndSelect('business.image', 'businessImage')
      .leftJoinAndSelect('business.locations', 'businessLocation')
      .leftJoinAndSelect('cart.creationUser', 'creationUser')
      .leftJoinAndSelect('creationUser.profileImage', 'userProfileImage');
    return queryBuilder;
  }
}
