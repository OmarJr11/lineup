import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CartSettersService } from './cart-setters.service';
import { CartItemsService } from '../cart-items/cart-items.service';
import { Cart, CartItem } from '../../entities';
import type { IUserReq } from '../../common/interfaces';

describe('CartSettersService', () => {
  const repositoryMock = {
    save: jest.fn(),
    remove: jest.fn(),
  };
  const cartItemsServiceMock = {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  let service: CartSettersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CartSettersService,
        {
          provide: getRepositoryToken(Cart),
          useValue: repositoryMock,
        },
        {
          provide: CartItemsService,
          useValue: cartItemsServiceMock,
        },
      ],
    }).compile();

    service = moduleRef.get(CartSettersService);
  });

  it('createCart saves a new cart with the user and business info', async () => {
    const user = { userId: 11, username: 'buyer' } as IUserReq;
    const cart = { idBusiness: 7, idCreationUser: 11 } as Cart;
    repositoryMock.save.mockResolvedValue(cart);

    await expect(service.createCart(7, user)).resolves.toEqual(cart);
    expect(repositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({
        idBusiness: 7,
        idCreationUser: 11,
        creationUser: 11,
        total: 0,
        itemsCount: 0,
        status: 'active',
      }),
      { data: user },
    );
  });

  it('createCartItem delegates to CartItemsService', async () => {
    const item = { id: 5 } as CartItem;
    cartItemsServiceMock.create.mockResolvedValue(item);

    await expect(
      service.createCartItem(1, 2, 3, 4, 10.5, { color: 'red' }),
    ).resolves.toBe(item);
    expect(cartItemsServiceMock.create).toHaveBeenCalledWith(
      1,
      2,
      3,
      4,
      10.5,
      { color: 'red' },
    );
  });

  it('updateCartItem delegates to CartItemsService', async () => {
    const item = { id: 5 } as CartItem;
    cartItemsServiceMock.update.mockResolvedValue(item);

    await expect(service.updateCartItem(item, 2, 9)).resolves.toBe(item);
    expect(cartItemsServiceMock.update).toHaveBeenCalledWith(item, 2, 9);
  });

  it('removeCartItem delegates to CartItemsService', async () => {
    const item = { id: 5 } as CartItem;
    await service.removeCartItem(item);
    expect(cartItemsServiceMock.remove).toHaveBeenCalledWith(item);
  });

  it('updateCartTotals persists the cart totals', async () => {
    const cart = { id: 1, total: 0, itemsCount: 0 } as Cart;
    const updated = { ...cart, total: 50, itemsCount: 2 } as Cart;
    repositoryMock.save.mockResolvedValue(updated);

    await expect(service.updateCartTotals(cart, 50, 2)).resolves.toEqual(
      updated,
    );
    expect(repositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({ total: 50, itemsCount: 2 }),
    );
  });

  it('removeCart removes the cart entity', async () => {
    const cart = { id: 1 } as Cart;
    await service.removeCart(cart);
    expect(repositoryMock.remove).toHaveBeenCalledWith(cart);
  });
});
