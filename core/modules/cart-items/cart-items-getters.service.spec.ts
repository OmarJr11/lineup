import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CartItemsGettersService } from './cart-items-getters.service';
import { CartItem } from '../../entities';

describe('CartItemsGettersService', () => {
  const repositoryMock = {
    createQueryBuilder: jest.fn(),
  };
  let service: CartItemsGettersService;

  const queryBuilderMock = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getRawOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    repositoryMock.createQueryBuilder.mockReturnValue(queryBuilderMock);

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CartItemsGettersService,
        {
          provide: getRepositoryToken(CartItem),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = moduleRef.get(CartItemsGettersService);
  });

  it('findById loads the cart item and related metadata', async () => {
    const item = { id: 10 } as CartItem;
    queryBuilderMock.getOne.mockResolvedValue(item);

    await expect(service.findById(10)).resolves.toBe(item);
    expect(queryBuilderMock.where).toHaveBeenCalledWith(
      'cartItem.id = :cartItemId',
      { cartItemId: 10 },
    );
  });

  it('findExisting matches by product, SKU, and variation', async () => {
    const item = { id: 11 } as CartItem;
    queryBuilderMock.getOne.mockResolvedValue(item);

    await expect(service.findExisting(1, 2, 3, { color: 'red' })).resolves.toBe(
      item,
    );
    expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
      'cartItem.idProductSku = :productSkuId',
      { productSkuId: 3 },
    );
  });

  it('findByCartId orders items newest first', async () => {
    const items = [{ id: 1 }, { id: 2 }] as CartItem[];
    queryBuilderMock.getMany.mockResolvedValue(items);

    await expect(service.findByCartId(1)).resolves.toEqual(items);
    expect(queryBuilderMock.orderBy).toHaveBeenCalledWith(
      'cartItem.creation_date',
      'DESC',
    );
  });

  it('calculateCartTotal sums subtotals and quantities', async () => {
    queryBuilderMock.getRawOne.mockResolvedValue({ total: '150', itemsCount: '4' });

    await expect(service.calculateCartTotal(1)).resolves.toEqual({
      total: 150,
      itemsCount: 4,
    });
  });
});
