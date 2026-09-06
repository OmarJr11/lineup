import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { CartService } from '../../../../core/modules/cart/cart.service';
import { CartSchema } from '../../../../core/schemas';
import { JwtAuthGuard, TokenGuard } from '../../../../core/common/guards';
import { Response, UserDec } from '../../../../core/common/decorators';
import { toCartSchema } from '../../../../core/common/functions';
import { IUserReq } from '../../../../core/common/interfaces';
import { AddToCartInput } from '../../../../core/modules/cart/dto/add-to-cart.input';
import { UpdateCartItemInput } from '../../../../core/modules/cart/dto/update-cart-item.input';
import { RemoveCartItemInput } from '../../../../core/modules/cart/dto/remove-cart-item.input';
import { GetCartByBusinessInput } from '../../../../core/modules/cart/dto/get-cart-by-business.input';

/** Resolver for authenticated user cart operations. */
@UsePipes(new ValidationPipe())
@Resolver(() => CartSchema)
@UseGuards(JwtAuthGuard, TokenGuard)
export class CartResolver {
  constructor(private readonly cartService: CartService) {}

  /**
   * Adds an item to the authenticated user's business-specific cart.
   * @param {AddToCartInput} data - Product and quantity information.
   * @param {IUserReq} user - Authenticated user context.
   * @returns {Promise<CartSchema>} The updated cart.
   */
  @Mutation(() => CartSchema, { name: 'addItemToCart' })
  @Response({ code: 200, message: 'Item agregado al carrito exitosamente' })
  async addItemToCart(
    @Args('data') data: AddToCartInput,
    @UserDec() user: IUserReq,
  ) {
    return toCartSchema(await this.cartService.addItemToCart(data, user));
  }

  /**
   * Updates the quantity of a cart item.
   * @param {UpdateCartItemInput} data - Item identifier and new quantity.
   * @param {IUserReq} user - Authenticated user context.
   * @returns {Promise<CartSchema>} The updated cart.
   */
  @Mutation(() => CartSchema, { name: 'updateCartItem' })
  @Response({ code: 200, message: 'Item actualizado exitosamente' })
  async updateCartItem(
    @Args('data') data: UpdateCartItemInput,
    @UserDec() user: IUserReq,
  ) {
    return toCartSchema(await this.cartService.updateCartItem(data, user));
  }

  /**
   * Removes an item from the authenticated user's cart.
   * @param {RemoveCartItemInput} data - Item identifier to remove.
   * @param {IUserReq} user - Authenticated user context.
   * @returns {Promise<CartSchema>} The updated cart.
   */
  @Mutation(() => CartSchema, { name: 'removeCartItem' })
  @Response({ code: 200, message: 'Item eliminado del carrito exitosamente' })
  async removeCartItem(
    @Args('data') data: RemoveCartItemInput,
    @UserDec() user: IUserReq,
  ) {
    return toCartSchema(await this.cartService.removeCartItem(data, user));
  }

  /**
   * Retrieves a cart by user and business.
   * @param {GetCartByBusinessInput} data - Business identifier.
   * @param {IUserReq} user - Authenticated user context.
   * @returns {Promise<CartSchema | null>} The matching cart or null.
   */
  @Query(() => CartSchema, { name: 'getCartByBusiness', nullable: true })
  async getCartByBusiness(
    @Args('data') data: GetCartByBusinessInput,
    @UserDec() user: IUserReq,
  ) {
    const cart = await this.cartService.getCartByBusiness(data, user);
    return cart ? toCartSchema(cart) : null;
  }

  /**
   * Retrieves all carts owned by the authenticated user.
   * @param {IUserReq} user - Authenticated user context.
   * @returns {Promise<CartSchema[]>} The user's carts.
   */
  @Query(() => [CartSchema], { name: 'getUserCarts' })
  async getUserCarts(@UserDec() user: IUserReq) {
    const carts = await this.cartService.getUserCarts(user);
    return carts.map((cart) => toCartSchema(cart));
  }

  /**
   * Removes all items from a user's cart for a business.
   * @param {number} businessId - Business identifier.
   * @param {IUserReq} user - Authenticated user context.
   * @returns {Promise<CartSchema | null>} The emptied cart or null.
   */
  @Mutation(() => CartSchema, { name: 'clearCart', nullable: true })
  @Response({ code: 200, message: 'Carrito vaciado exitosamente' })
  async clearCart(
    @Args('businessId', { type: () => Int }) businessId: number,
    @UserDec() user: IUserReq,
  ) {
    const cart = await this.cartService.clearCart(user, businessId);
    return cart ? toCartSchema(cart) : null;
  }
}
