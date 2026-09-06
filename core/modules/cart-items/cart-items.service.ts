import { Injectable, Scope } from '@nestjs/common';
import { CartItem } from '../../entities';
import { CartItemsGettersService } from './cart-items-getters.service';
import { CartItemsSettersService } from './cart-items-setters.service';

/** Coordinates CartItem reads and writes through the dedicated services. */
@Injectable({ scope: Scope.REQUEST })
export class CartItemsService {
  /**
   * Creates a cart item coordination service.
   * @param {CartItemsGettersService} getters - Service for cart item reads.
   * @param {CartItemsSettersService} setters - Service for cart item writes.
   */
  constructor(
    private readonly getters: CartItemsGettersService,
    private readonly setters: CartItemsSettersService,
  ) {}

  /**
   * Finds a cart item by its identifier.
   * @param {number} cartItemId - Cart item identifier.
   * @returns {Promise<CartItem | null>} The matching item, or `null` if it does not exist.
   */
  async findById(cartItemId: number): Promise<CartItem | null> {
    return await this.getters.findById(cartItemId);
  }

  /**
   * Finds an existing item matching the cart product and variation.
   * @param {number} cartId - Parent cart identifier.
   * @param {number} productId - Product identifier.
   * @param {number | undefined} productSkuId - Optional SKU identifier.
   * @param {Record<string, string> | undefined} variationOptions - Optional variation values.
   * @returns {Promise<CartItem | null>} The matching item, or `null` if it does not exist.
   */
  async findExisting(
    cartId: number,
    productId: number,
    productSkuId?: number,
    variationOptions?: Record<string, string>,
  ): Promise<CartItem | null> {
    return await this.getters.findExisting(
      cartId,
      productId,
      productSkuId,
      variationOptions,
    );
  }

  /**
   * Returns all items belonging to a cart.
   * @param {number} cartId - Parent cart identifier.
   * @returns {Promise<CartItem[]>} Items belonging to the cart.
   */
  async findByCartId(cartId: number): Promise<CartItem[]> {
    return await this.getters.findByCartId(cartId);
  }

  /**
   * Calculates the monetary total and item count for a cart.
   * @param {number} cartId - Parent cart identifier.
   * @returns {Promise<{ total: number; itemsCount: number }>} Cart totals.
   */
  async calculateCartTotal(
    cartId: number,
  ): Promise<{ total: number; itemsCount: number }> {
    return await this.getters.calculateCartTotal(cartId);
  }

  /**
   * Creates a new item in a cart.
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
    return await this.setters.create(
      cartId,
      productId,
      productSkuId,
      quantity,
      unitPrice,
      variationOptions,
    );
  }

  /**
   * Updates an item's quantity and unit price.
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
    return await this.setters.update(cartItem, quantity, unitPrice);
  }

  /**
   * Removes an item from its cart.
   * @param {CartItem} cartItem - Item to remove.
   * @returns {Promise<void>} Resolves when the item is removed.
   */
  async remove(cartItem: CartItem): Promise<void> {
    await this.setters.remove(cartItem);
  }
}
