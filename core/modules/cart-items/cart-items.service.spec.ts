import { Test, type TestingModule } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { CartItemsService } from './cart-items.service';
import { CartItemsGettersService } from './cart-items-getters.service';
import { CartItemsSettersService } from './cart-items-setters.service';
import type { CartItem } from '../../entities';

describe('CartItemsService', () => {
  const cartItemsGettersServiceMock = {
    findById: jest.fn(),
    findExisting: jest.fn(),
    findByCartId: jest.fn(),
    calculateCartTotal: jest.fn(),
  };
  const cartItemsSettersServiceMock = {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  let service: CartItemsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CartItemsService,
        { provide: REQUEST, useValue: {} },
        {
          provide: CartItemsGettersService,
          useValue: cartItemsGettersServiceMock,
        },
        {
          provide: CartItemsSettersService,
          useValue: cartItemsSettersServiceMock,
        },
      ],
    }).compile();

    service = await moduleRef.resolve(CartItemsService);
  });

  it('findById delegates to getters', async () => {
    const item = { id: 12 } as CartItem;
    cartItemsGettersServiceMock.findById.mockResolvedValue(item);

    await expect(service.findById(12)).resolves.toBe(item);
    expect(cartItemsGettersServiceMock.findById).toHaveBeenCalledWith(12);
  });

  it('findExisting delegates to getters with the selection values', async () => {
    const item = { id: 22 } as CartItem;
    cartItemsGettersServiceMock.findExisting.mockResolvedValue(item);

    await expect(
      service.findExisting(7, 10, 15, { color: 'red' }),
    ).resolves.toBe(item);
    expect(cartItemsGettersServiceMock.findExisting).toHaveBeenCalledWith(
      7,
      10,
      15,
      { color: 'red' },
    );
  });

  it('findByCartId delegates to getters', async () => {
    const items = [{ id: 1 }, { id: 2 }] as CartItem[];
    cartItemsGettersServiceMock.findByCartId.mockResolvedValue(items);

    await expect(service.findByCartId(7)).resolves.toBe(items);
    expect(cartItemsGettersServiceMock.findByCartId).toHaveBeenCalledWith(7);
  });

  it('calculateCartTotal delegates to getters', async () => {
    const totals = { total: 99.5, itemsCount: 3 };
    cartItemsGettersServiceMock.calculateCartTotal.mockResolvedValue(totals);

    await expect(service.calculateCartTotal(7)).resolves.toEqual(totals);
    expect(cartItemsGettersServiceMock.calculateCartTotal).toHaveBeenCalledWith(
      7,
    );
  });

  it('create delegates to setters', async () => {
    const created = { id: 3, idCart: 7, quantity: 2 } as CartItem;
    cartItemsSettersServiceMock.create.mockResolvedValue(created);

    await expect(
      service.create(7, 10, 15, 2, 12.5, { color: 'red' }),
    ).resolves.toBe(created);
    expect(cartItemsSettersServiceMock.create).toHaveBeenCalledWith(
      7,
      10,
      15,
      2,
      12.5,
      { color: 'red' },
    );
  });

  it('update delegates to setters', async () => {
    const item = { id: 3, quantity: 2 } as CartItem;
    const updated = { ...item, quantity: 5 } as CartItem;
    cartItemsSettersServiceMock.update.mockResolvedValue(updated);

    await expect(service.update(item, 5, 20)).resolves.toBe(updated);
    expect(cartItemsSettersServiceMock.update).toHaveBeenCalledWith(
      item,
      5,
      20,
    );
  });

  it('remove delegates to setters', async () => {
    const item = { id: 9 } as CartItem;

    await service.remove(item);

    expect(cartItemsSettersServiceMock.remove).toHaveBeenCalledWith(item);
  });
});
