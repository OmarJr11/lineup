import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Cart, CartItem } from '../../entities';
import { Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { LogError } from '../../common/helpers/logger.helper';
import { cartsResponses } from '../../common/responses';
import { CartItemsService } from '../cart-items/cart-items.service';
import { IUserReq } from '../../common/interfaces/user-req.interface';

@Injectable()
export class CartSettersService extends BasicService<Cart> {
  private readonly logger = new Logger(CartSettersService.name);
  private readonly rCreate = cartsResponses.create;
  private readonly rUpdate = cartsResponses.update;
  private readonly rDelete = cartsResponses.delete;

  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    private readonly cartItemsService: CartItemsService,
  ) {
    super(cartRepository);
  }

  /**
   * Crear un nuevo carrito
   * @param {number} businessId - Identifier of the business.
   * @param {IUserReq} user - Authenticated user context.
   * @returns {Promise<Cart>} The created cart.
   */
  async createCart(businessId: number, user: IUserReq): Promise<Cart> {
    try {
      const cart = {
        idBusiness: businessId,
        total: 0,
        itemsCount: 0,
        lastActivityDate: new Date(),
        idCreationUser: user.userId,
      };
      return await this.save(cart, user);
    } catch (error) {
      LogError(this.logger, error as Error, this.createCart.name);
      throw new InternalServerErrorException(this.rCreate.error);
    }
  }

  /**
   * Crear item en el carrito
   */
  async createCartItem(
    cartId: number,
    productId: number,
    productSkuId: number | undefined,
    quantity: number,
    unitPrice: number,
    variationOptions: Record<string, string> | undefined,
  ): Promise<CartItem> {
    return await this.cartItemsService.create(
      cartId,
      productId,
      productSkuId,
      quantity,
      unitPrice,
      variationOptions,
    );
  }

  /**
   * Actualizar item del carrito
   */
  async updateCartItem(
    cartItem: CartItem,
    quantity: number,
    unitPrice: number,
  ): Promise<CartItem> {
    return await this.cartItemsService.update(cartItem, quantity, unitPrice);
  }

  /**
   * Eliminar item del carrito
   */
  async removeCartItem(cartItem: CartItem): Promise<void> {
    await this.cartItemsService.remove(cartItem);
  }

  /**
   * Actualizar totales del carrito
   */
  async updateCartTotals(
    cart: Cart,
    total: number,
    itemsCount: number,
  ): Promise<Cart> {
    try {
      cart.total = total;
      cart.itemsCount = itemsCount;
      cart.lastActivityDate = new Date();
      return await this.cartRepository.save(cart);
    } catch (error) {
      LogError(this.logger, error as Error, this.updateCartTotals.name);
      throw new InternalServerErrorException(this.rUpdate.error);
    }
  }

  /**
   * Eliminar carrito completo
   */
  async removeCart(cart: Cart): Promise<void> {
    try {
      await this.cartRepository.remove(cart);
    } catch (error) {
      LogError(this.logger, error as Error, this.removeCart.name);
      throw new InternalServerErrorException(this.rDelete.error);
    }
  }
}
