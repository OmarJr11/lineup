import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CartItemsSettersService } from './cart-items-setters.service';
import { CartItem } from '../../entities';

describe('CartItemsSettersService', () => {
  const repositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  let service: CartItemsSettersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CartItemsSettersService,
        {
          provide: getRepositoryToken(CartItem),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = moduleRef.get(CartItemsSettersService);
  });

  it('create builds an item with subtotal and saves it', async () => {
    const created = { id: 7, subtotal: 40 } as CartItem;
    repositoryMock.create.mockReturnValue(created);
    repositoryMock.save.mockResolvedValue(created);

    await expect(
      service.create(1, 2, 3, 4, 10, { color: 'red' }),
    ).resolves.toBe(created);
    expect(repositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        idCart: 1,
        idProduct: 2,
        idProductSku: 3,
        quantity: 4,
        unitPrice: 10,
        subtotal: 40,
        variationOptions: { color: 'red' },
      }),
    );
  });

  it('update recalculates subtotal before saving', async () => {
    const item = { id: 7, quantity: 1, unitPrice: 5, subtotal: 5 } as CartItem;
    repositoryMock.save.mockResolvedValue({ ...item, quantity: 3, subtotal: 45 });

    await expect(service.update(item, 3, 15)).resolves.toEqual(
      expect.objectContaining({ quantity: 3, subtotal: 45 }),
    );
    expect(repositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 3, unitPrice: 15, subtotal: 45 }),
    );
  });

  it('remove deletes the cart item entity', async () => {
    const item = { id: 7 } as CartItem;
    await service.remove(item);
    expect(repositoryMock.remove).toHaveBeenCalledWith(item);
  });
});
