import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CartGettersService } from './cart-getters.service';
import { CartItemsService } from '../cart-items/cart-items.service';
import { Cart } from '../../entities';

describe('CartGettersService', () => {
  const repositoryMock = {
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
  };
  const cartItemsServiceMock = {
    findById: jest.fn(),
    findExisting: jest.fn(),
    findByCartId: jest.fn(),
    calculateCartTotal: jest.fn(),
  };
  let service: CartGettersService;

  const queryBuilderMock = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    repositoryMock.createQueryBuilder.mockReturnValue(queryBuilderMock);

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CartGettersService,
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

    service = moduleRef.get(CartGettersService);
  });

  it('getCartByUserAndBusiness returns the matching cart', async () => {
    const cart = { id: 5 } as Cart;
    queryBuilderMock.getOne.mockResolvedValue(cart);

    await expect(service.getCartByUserAndBusiness(11, 7)).resolves.toBe(cart);
    expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith('cart');
    expect(queryBuilderMock.where).toHaveBeenCalledWith(
      'cart.idCreationUser = :userId',
      { userId: 11 },
    );
  });

  it('getCartItemById delegates to cart items service', async () => {
    const cartItem = { id: 22 } as any;
    cartItemsServiceMock.findById.mockResolvedValue(cartItem);

    await expect(service.getCartItemById(22)).resolves.toBe(cartItem);
    expect(cartItemsServiceMock.findById).toHaveBeenCalledWith(22);
  });

  it('findExistingCartItem delegates to cart items service', async () => {
    const cartItem = { id: 12 } as any;
    cartItemsServiceMock.findExisting.mockResolvedValue(cartItem);

    await expect(
      service.findExistingCartItem(1, 2, 3, { color: 'red' }),
    ).resolves.toBe(cartItem);
    expect(cartItemsServiceMock.findExisting).toHaveBeenCalledWith(
      1,
      2,
      3,
      { color: 'red' },
    );
  });

  it('getUserCarts loads carts owned by the user', async () => {
    const carts = [{ id: 1 }, { id: 2 }] as Cart[];
    queryBuilderMock.getMany.mockResolvedValue(carts);

    await expect(service.getUserCarts(11)).resolves.toEqual(carts);
    expect(queryBuilderMock.orderBy).toHaveBeenCalledWith(
      'cart.lastActivityDate',
      'DESC',
    );
  });

  it('cartExists counts carts for user and business', async () => {
    repositoryMock.count.mockResolvedValue(2);

    await expect(service.cartExists(11, 7)).resolves.toBe(true);
    expect(repositoryMock.count).toHaveBeenCalledWith({
      where: { idCreationUser: 11, idBusiness: 7 },
    });
  });
});
