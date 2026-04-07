jest.mock('typeorm-transactional-cls-hooked', () => {
  const actual =
    jest.requireActual<typeof import('typeorm-transactional-cls-hooked')>(
      'typeorm-transactional-cls-hooked',
    );
  return {
    ...actual,
    Transactional:
      () =>
      (
        _target: object,
        _propertyKey: string | symbol,
        descriptor: PropertyDescriptor,
      ): PropertyDescriptor =>
        descriptor,
  };
});

import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DiscountProductsSettersService } from './discount-products-setters.service';
import { DiscountProduct } from '../../entities';

/**
 * Unit tests for {@link DiscountProductsSettersService}.
 */
describe('DiscountProductsSettersService', () => {
  const repositoryMock = {
    save: jest.fn(),
    update: jest.fn(),
    findOneOrFail: jest.fn(),
    remove: jest.fn(),
    metadata: {
      columns: [
        { propertyName: 'id' },
        { propertyName: 'idProduct' },
        { propertyName: 'idDiscount' },
        { propertyName: 'idCreationBusiness' },
        { propertyName: 'modificationDate' },
        { propertyName: 'modificationUser' },
        { propertyName: 'modificationBusiness' },
        { propertyName: 'creationDate' },
        { propertyName: 'creationUser' },
        { propertyName: 'creationIp' },
        { propertyName: 'modificationIp' },
        { propertyName: 'creationCoordinate' },
        { propertyName: 'modificationCoordinate' },
      ],
    },
  };
  let service: DiscountProductsSettersService;
  const businessReq = { path: '/b', businessId: 2 };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountProductsSettersService,
        {
          provide: getRepositoryToken(DiscountProduct),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(DiscountProductsSettersService);
  });

  describe('create', () => {
    it('persists via save and returns the row', async () => {
      const created = {
        id: 4,
        idProduct: 10,
        idDiscount: 20,
      } as DiscountProduct;
      repositoryMock.save.mockResolvedValue(created);
      const result = await service.create(10, 20, businessReq);
      expect(result).toBe(created);
      expect(repositoryMock.save).toHaveBeenCalled();
    });
    it('throws InternalServerErrorException when save fails', async () => {
      repositoryMock.save.mockRejectedValue(new Error('db'));
      await expect(service.create(1, 2, businessReq)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateDiscount', () => {
    it('calls update and reloads via findOneOrFail', async () => {
      const dp = {
        id: 1,
        idProduct: 5,
        idDiscount: 10,
        product: {} as never,
        discount: {} as never,
        creationBusiness: {} as never,
      } as unknown as DiscountProduct;
      const updated = { ...dp, idDiscount: 99 } as DiscountProduct;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(updated);
      await service.updateDiscount(dp, 99, businessReq);
      expect(repositoryMock.update).toHaveBeenCalled();
    });
    it('throws InternalServerErrorException when update fails', async () => {
      const dp = { id: 1, idProduct: 5, idDiscount: 10 } as DiscountProduct;
      repositoryMock.update.mockRejectedValue(new Error('db'));
      await expect(
        service.updateDiscount(dp, 20, businessReq),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('removeMany', () => {
    it('does nothing when list is empty', async () => {
      await service.removeMany([], { userId: 1, username: 'u' });
      expect(repositoryMock.remove).not.toHaveBeenCalled();
    });
    it('calls repository.remove when list is non-empty', async () => {
      const rows = [{ id: 1 } as DiscountProduct];
      repositoryMock.remove.mockResolvedValue(undefined);
      await service.removeMany(rows, { userId: 1, username: 'u' });
      expect(repositoryMock.remove).toHaveBeenCalledWith(rows, {
        data: { userId: 1, username: 'u' },
      });
    });
    it('throws InternalServerErrorException when remove fails', async () => {
      const rows = [{ id: 1 } as DiscountProduct];
      repositoryMock.remove.mockRejectedValue(new Error('db'));
      await expect(
        service.removeMany(rows, { userId: 1, username: 'u' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
