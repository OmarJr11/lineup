import { BadRequestException, Injectable, Scope } from '@nestjs/common';
import { Cart, CartItem } from '../../entities';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { AddToCartInput } from './dto/add-to-cart.input';
import { UpdateCartItemInput } from './dto/update-cart-item.input';
import { RemoveCartItemInput } from './dto/remove-cart-item.input';
import { GetCartByBusinessInput } from './dto/get-cart-by-business.input';
import { CartGettersService } from './cart-getters.service';
import { CartSettersService } from './cart-setters.service';
import { ProductsService } from '../products/products.service';
import { ProductSkusService } from '../product-skus/product-skus.service';
import { IUserReq } from '../../common/interfaces';
import { cartsResponses } from '../../common/responses';

/**
 * Coordinates cart operations, including item management, validation, and
 * cart total recalculation.
 */
@Injectable({ scope: Scope.REQUEST })
export class CartService {
  /** Response definitions for add-item validation errors. */
  private readonly rAddItem = cartsResponses.addItem;
  /** Response definitions for update-item validation errors. */
  private readonly rUpdateItem = cartsResponses.updateItem;
  /** Response definitions for remove-item validation errors. */
  private readonly rRemoveItem = cartsResponses.removeItem;
  /** Response definitions for cart lookup errors. */
  private readonly rCart = cartsResponses.cart;

  /**
   * Creates a cart service.
   * @param {CartGettersService} cartGettersService - Service for cart reads.
   * @param {CartSettersService} cartSettersService - Service for cart writes.
   * @param {ProductsService} productsService - Service for product lookups.
   * @param {ProductSkusService} productSkusService - Service for SKU lookups.
   */
  constructor(
    private readonly cartGettersService: CartGettersService,
    private readonly cartSettersService: CartSettersService,
    private readonly productsService: ProductsService,
    private readonly productSkusService: ProductSkusService,
  ) {}

  /**
   * Adds an item to the user's cart or increases the quantity of an existing
   * matching item.
   * @param {AddToCartInput} data - Product, business, quantity, and variation data.
   * @param {IUserReq} user - Authenticated user context.
   * @returns {Promise<Cart>} The updated cart.
   */
  @Transactional()
  async addItemToCart(data: AddToCartInput, user: IUserReq): Promise<Cart> {
    // Ensure the product belongs to the requested business.
    await this.validateProductBelongsToBusiness(
      data.productId,
      data.businessId,
    );
    // Get or create the cart for this user and business.
    let cart = await this.findOrCreateCart(user, data.businessId);

    // Validate the SKU when one is provided.
    if (data.productSkuId) {
      await this.validateProductSku(data.productSkuId, data.productId);
    }

    // Calculate the unit price.
    const unitPrice = await this.calculateUnitPrice(
      data.productId,
      data.productSkuId,
    );

    // Check whether the item already exists in the cart.
    const existingItem = await this.findExistingCartItem(
      cart.id,
      data.productId,
      data.productSkuId,
      data.variationOptions,
    );

    if (existingItem) {
      // Update the quantity and subtotal.
      await this.updateCartItemQuantity(
        existingItem,
        existingItem.quantity + data.quantity,
        unitPrice,
      );
    } else {
      // Create a new item.
      await this.createCartItem(
        cart.id,
        data.productId,
        data.productSkuId,
        data.quantity,
        unitPrice,
        data.variationOptions,
      );
    }

    // Recalculate the cart totals.
    cart = await this.recalculateCartTotals(cart.id);

    return cart;
  }

  /**
   * Returns all carts owned by a user.
   * @param {IUserReq} user - Authenticated user context.
   * @returns {Promise<Cart[]>} All carts owned by the user.
   */
  async getUserCarts(user: IUserReq): Promise<Cart[]> {
    return await this.cartGettersService.getUserCarts(user.userId);
  }

  /**
   * Removes every item from a user's cart for a business.
   * @param {IUserReq} user - Authenticated user context.
   * @param {number} businessId - Business identifier.
   * @returns {Promise<Cart | null>} The emptied cart, or `null` if it does not exist.
   */
  async clearCart(user: IUserReq, businessId: number): Promise<Cart | null> {
    const cart = await this.cartGettersService.getCartByUserAndBusiness(
      user.userId,
      businessId,
    );

    if (!cart) {
      return null;
    }

    for (const item of cart.items ?? []) {
      await this.cartSettersService.removeCartItem(item);
    }
    return await this.recalculateCartTotals(cart.id);
  }

  /**
   * Updates the quantity of an item in the cart.
   * @param {UpdateCartItemInput} data - Item identifier and quantity data.
   * @param {IUserReq} user - Authenticated user context.
   * @returns {Promise<Cart>} The updated cart.
   */
  @Transactional()
  async updateCartItem(
    data: UpdateCartItemInput,
    user: IUserReq,
  ): Promise<Cart> {
    const cartItem = await this.cartGettersService.getCartItemById(
      data.cartItemId,
    );

    if (
      !cartItem ||
      Number(cartItem.cart?.idCreationUser) !== Number(user.userId)
    ) {
      throw new BadRequestException(this.rUpdateItem.itemNotFound);
    }

    // Recalculate the unit price.
    const unitPrice = await this.calculateUnitPrice(
      cartItem.idProduct,
      cartItem.idProductSku,
    );

    // Update the quantity and subtotal.
    await this.cartSettersService.updateCartItem(
      cartItem,
      data.quantity,
      unitPrice,
    );

    // Recalculate the cart totals.
    const cart = await this.recalculateCartTotals(cartItem.idCart);

    return cart;
  }

  /**
   * Removes an item from the cart.
   * @param {RemoveCartItemInput} data - Item identifier to remove.
   * @param {IUserReq} user - Authenticated user context.
   * @returns {Promise<Cart>} The updated cart.
   */
  @Transactional()
  async removeCartItem(
    data: RemoveCartItemInput,
    user: IUserReq,
  ): Promise<Cart> {
    const cartItem = await this.cartGettersService.getCartItemById(
      data.cartItemId,
    );

    if (
      !cartItem ||
      Number(cartItem.cart?.idCreationUser) !== Number(user.userId)
    ) {
      throw new BadRequestException(this.rRemoveItem.itemNotFound);
    }

    const cartId = cartItem.idCart;

    // Remove the item.
    await this.cartSettersService.removeCartItem(cartItem);

    // Recalculate the cart totals.
    const cart = await this.recalculateCartTotals(cartId);

    return cart;
  }

  /**
   * Gets a cart owned by the user for a specific business.
   * @param {GetCartByBusinessInput} data - Business lookup data.
   * @param {IUserReq} user - Authenticated user context.
   * @returns {Promise<Cart | null>} The matching cart, or `null` if none exists.
   */
  async getCartByBusiness(
    data: GetCartByBusinessInput,
    user: IUserReq,
  ): Promise<Cart | null> {
    const cart = await this.cartGettersService.getCartByUserAndBusiness(
      user.userId,
      data.businessId,
    );

    if (!cart) {
      return null;
    }

    return cart;
  }

  /**
   * Ensures that a product belongs to the requested business.
   * @param {number} productId - Product identifier.
   * @param {number} businessId - Business identifier.
   * @returns {Promise<void>} Resolves when the product belongs to the business.
   * @throws {BadRequestException} If the product belongs to another business.
   */
  private async validateProductBelongsToBusiness(
    productId: number,
    businessId: number,
  ): Promise<void> {
    const product = await this.productsService.findOne(productId);
    if (Number(product.idCreationBusiness) !== Number(businessId)) {
      throw new BadRequestException(this.rAddItem.productNotBelongs);
    }
  }

  /**
   * Ensures that a SKU belongs to the requested product.
   * @param {number} productSkuId - SKU identifier.
   * @param {number} productId - Product identifier.
   * @returns {Promise<void>} Resolves when the SKU belongs to the product.
   * @throws {BadRequestException} If the SKU belongs to another product.
   */
  private async validateProductSku(
    productSkuId: number,
    productId: number,
  ): Promise<void> {
    const productSku = await this.productSkusService.findOne(productSkuId);
    if (Number(productSku.idProduct) !== Number(productId)) {
      throw new BadRequestException(this.rAddItem.skuNotBelongs);
    }
  }

  /**
   * Finds or creates a cart for a user and business.
   * @param {IUserReq} user - Authenticated user context.
   * @param {number} businessId - Business identifier.
   * @returns {Promise<Cart>} The existing or newly created cart.
   */
  private async findOrCreateCart(
    user: IUserReq,
    businessId: number,
  ): Promise<Cart> {
    let cart = await this.cartGettersService.getCartByUserAndBusiness(
      user.userId,
      businessId,
    );

    if (!cart) {
      cart = await this.cartSettersService.createCart(businessId, user);
    }

    return cart;
  }

  /**
   * Calculates the unit price for a product SKU.
   * @param {number} productId - Product identifier.
   * @param {number | undefined} productSkuId - Optional SKU identifier.
   * @returns {Promise<number>} The resolved unit price.
   * @throws {BadRequestException} If no valid price is available.
   */
  private async calculateUnitPrice(
    productId: number,
    productSkuId?: number,
  ): Promise<number> {
    if (productSkuId) {
      const productSku = await this.productSkusService.findOne(productSkuId);

      if (productSku?.price) {
        return Number(productSku.price);
      }
    }

    // Products without a resolvable SKU price cannot be added.
    throw new BadRequestException(this.rAddItem.priceNotAvailable);
  }

  /**
   * Finds an existing cart item with the same product selection.
   * @param {number} cartId - Cart identifier.
   * @param {number} productId - Product identifier.
   * @param {number | undefined} productSkuId - Optional SKU identifier.
   * @param {Record<string, string> | undefined} variationOptions - Optional variation values.
   * @returns {Promise<CartItem | null>} The matching item, or `null` if none exists.
   */
  private async findExistingCartItem(
    cartId: number,
    productId: number,
    productSkuId?: number,
    variationOptions?: Record<string, string>,
  ): Promise<CartItem | null> {
    return await this.cartGettersService.findExistingCartItem(
      cartId,
      productId,
      productSkuId,
      variationOptions,
    );
  }

  /**
   * Creates a new cart item through CartItemsService.
   * @param {number} cartId - Cart identifier.
   * @param {number} productId - Product identifier.
   * @param {number | undefined} productSkuId - Optional SKU identifier.
   * @param {number} quantity - Number of units.
   * @param {number} unitPrice - Price per unit.
   * @param {Record<string, string> | undefined} variationOptions - Optional variation values.
   * @returns {Promise<CartItem>} The created cart item.
   */
  private async createCartItem(
    cartId: number,
    productId: number,
    productSkuId: number | undefined,
    quantity: number,
    unitPrice: number,
    variationOptions?: Record<string, string>,
  ): Promise<CartItem> {
    return await this.cartSettersService.createCartItem(
      cartId,
      productId,
      productSkuId,
      quantity,
      unitPrice,
      variationOptions,
    );
  }

  /**
   * Updates an existing cart item's quantity and subtotal.
   * @param {CartItem} cartItem - Cart item to update.
   * @param {number} newQuantity - New item quantity.
   * @param {number} unitPrice - Price per unit.
   * @returns {Promise<void>} Resolves when the item has been updated.
   */
  private async updateCartItemQuantity(
    cartItem: CartItem,
    newQuantity: number,
    unitPrice: number,
  ): Promise<void> {
    cartItem.quantity = newQuantity;
    cartItem.subtotal = unitPrice * newQuantity;
    await this.cartSettersService.updateCartItem(
      cartItem,
      newQuantity,
      unitPrice,
    );
  }

  /**
   * Recalculates and persists the cart totals.
   * @param {number} cartId - Cart identifier.
   * @returns {Promise<Cart>} The cart with updated totals.
   * @throws {BadRequestException} If the cart does not exist.
   */
  private async recalculateCartTotals(cartId: number): Promise<Cart> {
    const cart = await this.cartGettersService.getCartById(cartId);

    if (!cart) {
      throw new BadRequestException(this.rCart.notFound);
    }

    const { total, itemsCount } =
      await this.cartGettersService.calculateCartTotal(cartId);

    cart.total = total;
    cart.itemsCount = itemsCount;
    cart.lastActivityDate = new Date();

    return await this.cartSettersService.updateCartTotals(
      cart,
      total,
      itemsCount,
    );
  }
}
