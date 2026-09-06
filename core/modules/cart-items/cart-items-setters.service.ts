import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { LogError } from '../../common/helpers/logger.helper';
import { cartItemsResponses } from '../../common/responses';
import { CartItem } from '../../entities';

/** Provides write operations for cart items. */
@Injectable()
export class CartItemsSettersService extends BasicService<CartItem> {
  private readonly logger = new Logger(CartItemsSettersService.name);
  private readonly rCreate = cartItemsResponses.create;
  private readonly rUpdate = cartItemsResponses.update;
  private readonly rDelete = cartItemsResponses.delete;

  /**
   * Creates a cart item setter service.
   * @param {Repository<CartItem>} cartItemRepository - Cart item repository.
   */
  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
  ) {
    super(cartItemRepository);
  }

  /**
   * Creates a cart item with its calculated subtotal.
   * @param {number} cartId - Parent cart identifier.
   * @param {number} productId - Product identifier.
   * @param {number | undefined} productSkuId - Optional SKU identifier.
   * @param {number} quantity - Number of units.
   * @param {number} unitPrice - Price per unit.
   * @param {Record<string, string> | undefined} variationOptions - Optional variation values.
   * @returns {Promise<CartItem>} The created item.
   */
  async create(
    cartId: number,
    productId: number,
    productSkuId: number | undefined,
    quantity: number,
    unitPrice: number,
    variationOptions?: Record<string, string>,
  ): Promise<CartItem> {
    try {
      const cartItem = this.cartItemRepository.create({
        idCart: cartId,
        idProduct: productId,
        idProductSku: productSkuId,
        quantity,
        unitPrice,
        subtotal: unitPrice * quantity,
        variationOptions,
      });

      return await this.cartItemRepository.save(cartItem);
    } catch (error) {
      LogError(this.logger, error as Error, this.create.name);
      throw new InternalServerErrorException(this.rCreate.error);
    }
  }

  /**
   * Updates the quantity, unit price, and subtotal of an item.
   * @param {CartItem} cartItem - Item to update.
   * @param {number} quantity - New quantity.
   * @param {number} unitPrice - New unit price.
   * @returns {Promise<CartItem>} The updated item.
   */
  async update(
    cartItem: CartItem,
    quantity: number,
    unitPrice: number,
  ): Promise<CartItem> {
    try {
      cartItem.quantity = quantity;
      cartItem.unitPrice = unitPrice;
      cartItem.subtotal = unitPrice * quantity;
      return await this.cartItemRepository.save(cartItem);
    } catch (error) {
      LogError(this.logger, error as Error, this.update.name);
      throw new InternalServerErrorException(this.rUpdate.error);
    }
  }

  /**
   * Permanently removes a cart item.
   * @param {CartItem} cartItem - Item to remove.
   * @returns {Promise<void>} Resolves when the item is removed.
   */
  async remove(cartItem: CartItem): Promise<void> {
    try {
      await this.cartItemRepository.remove(cartItem);
    } catch (error) {
      LogError(this.logger, error as Error, this.remove.name);
      throw new InternalServerErrorException(this.rDelete.error);
    }
  }
}
