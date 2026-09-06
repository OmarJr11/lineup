jest.mock('typeorm-transactional-cls-hooked', () => ({
  Transactional:
    () =>
    (
      _target: object,
      _propertyKey: string | symbol,
      descriptor: PropertyDescriptor,
    ): PropertyDescriptor =>
      descriptor,
}));

import { BadRequestException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { CartGettersService } from './cart-getters.service';
import { CartSettersService } from './cart-setters.service';
import { ProductsService } from '../products/products.service';
import { ProductSkusService } from '../product-skus/product-skus.service';
import type { Cart, CartItem } from '../../entities';
import type { IUserReq } from '../../common/interfaces';

describe('CartService', () => {
  const cartGettersServiceMock = {
    getCartByUserAndBusiness: jest.fn(),
    getCartById: jest.fn(),
    findExistingCartItem: jest.fn(),
    getCartItemById: jest.fn(),
    calculateCartTotal: jest.fn(),
  };
  const cartSettersServiceMock = {
    createCart: jest.fn(),
    createCartItem: jest.fn(),
    updateCartItem: jest.fn(),
    removeCartItem: jest.fn(),
    updateCartTotals: jest.fn(),
  };
  const productsServiceMock = {
    findOne: jest.fn(),
  };
  const productSkusServiceMock = {
    findOne: jest.fn(),
  };

  let service: CartService;
  const user: IUserReq = { userId: 11, username: 'buyer' };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: REQUEST, useValue: {} },
        {
          provide: CartGettersService,
          useValue: cartGettersServiceMock,
        },
        {
          provide: CartSettersService,
          useValue: cartSettersServiceMock,
        },
        {
          provide: ProductsService,
          useValue: productsServiceMock,
        },
        {
          provide: ProductSkusService,
          useValue: productSkusServiceMock,
        },
      ],
    }).compile();

    service = await moduleRef.resolve(CartService);
  });

  it('adds a new item to an existing cart and recalculates totals', async () => {
    const cart = { id: 7 } as Cart;
    const createdItem = { id: 99, idCart: 7 } as CartItem;
    const updatedCart = { id: 7, total: 120, itemsCount: 3 } as Cart;

    productsServiceMock.findOne.mockResolvedValue({ idCreationBusiness: 9 });
    cartGettersServiceMock.getCartByUserAndBusiness.mockResolvedValue(cart);
    productSkusServiceMock.findOne.mockResolvedValue({ idProduct: 10, price: 30 });
    cartGettersServiceMock.findExistingCartItem.mockResolvedValue(null);
    cartSettersServiceMock.createCartItem.mockResolvedValue(createdItem);
    cartGettersServiceMock.getCartById.mockResolvedValue(cart);
    cartGettersServiceMock.calculateCartTotal.mockResolvedValue({
      total: 120,
      itemsCount: 3,
    });
    cartSettersServiceMock.updateCartTotals.mockResolvedValue(updatedCart);

    await expect(
      service.addItemToCart(
        { productId: 10, businessId: 9, productSkuId: 5, quantity: 4 },
        user,
      ),
    ).resolves.toBe(updatedCart);

    expect(cartSettersServiceMock.createCartItem).toHaveBeenCalledWith(
      7,
      10,
      5,
      4,
      30,
      undefined,
    );
    expect(cartSettersServiceMock.updateCartTotals).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7 }),
      120,
      3,
    );
  });

  it('adds quantity to an existing item instead of creating a duplicate', async () => {
    const cart = { id: 7 } as Cart;
    const existingItem = {
      id: 19,
      idCart: 7,
      idProduct: 10,
      quantity: 2,
    } as CartItem;
    const updatedCart = { id: 7, total: 90, itemsCount: 5 } as Cart;

    productsServiceMock.findOne.mockResolvedValue({ idCreationBusiness: 9 });
    cartGettersServiceMock.getCartByUserAndBusiness.mockResolvedValue(cart);
    productSkusServiceMock.findOne.mockResolvedValue({ idProduct: 10, price: 15 });
    cartGettersServiceMock.findExistingCartItem.mockResolvedValue(existingItem);
    cartSettersServiceMock.updateCartItem.mockResolvedValue({
      ...existingItem,
      quantity: 5,
    });
    cartGettersServiceMock.getCartById.mockResolvedValue(cart);
    cartGettersServiceMock.calculateCartTotal.mockResolvedValue({
      total: 90,
      itemsCount: 5,
    });
    cartSettersServiceMock.updateCartTotals.mockResolvedValue(updatedCart);

    await expect(
      service.addItemToCart(
        { productId: 10, businessId: 9, productSkuId: 5, quantity: 3 },
        user,
      ),
    ).resolves.toBe(updatedCart);

    expect(cartSettersServiceMock.updateCartItem).toHaveBeenCalledWith(
      existingItem,
      5,
      15,
    );
    expect(cartSettersServiceMock.createCartItem).not.toHaveBeenCalled();
  });

  it('throws when the product does not belong to the requested business', async () => {
    productsServiceMock.findOne.mockResolvedValue({ idCreationBusiness: 2 });

    await expect(
      service.addItemToCart(
        { productId: 10, businessId: 9, productSkuId: 5, quantity: 1 },
        user,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(cartGettersServiceMock.getCartByUserAndBusiness).not.toHaveBeenCalled();
  });

  it('updates an item only when user owns the cart item', async () => {
    const cartItem = {
      id: 5,
      idCart: 7,
      cart: { idCreationUser: 99 },
      idProduct: 10,
      idProductSku: 5,
    } as CartItem;

    cartGettersServiceMock.getCartItemById.mockResolvedValue(cartItem);

    await expect(
      service.updateCartItem({ cartItemId: 5, quantity: 4 }, user),
    ).rejects.toThrow(BadRequestException);
    expect(cartSettersServiceMock.updateCartItem).not.toHaveBeenCalled();
  });

  it('removes an item and recalculates totals for the owning user', async () => {
    const cartItem = {
      id: 5,
      idCart: 7,
      cart: { idCreationUser: 11 },
      idProduct: 10,
      idProductSku: 5,
    } as CartItem;
    const cart = { id: 7 } as Cart;
    const updatedCart = { id: 7, total: 0, itemsCount: 0 } as Cart;

    cartGettersServiceMock.getCartItemById.mockResolvedValue(cartItem);
    cartSettersServiceMock.removeCartItem.mockResolvedValue(undefined);
    cartGettersServiceMock.getCartById.mockResolvedValue(cart);
    cartGettersServiceMock.calculateCartTotal.mockResolvedValue({
      total: 0,
      itemsCount: 0,
    });
    cartSettersServiceMock.updateCartTotals.mockResolvedValue(updatedCart);

    await expect(
      service.removeCartItem({ cartItemId: 5 }, user),
    ).resolves.toBe(updatedCart);
    expect(cartSettersServiceMock.removeCartItem).toHaveBeenCalledWith(cartItem);
  });
});
