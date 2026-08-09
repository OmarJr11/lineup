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
import { ProductVisitsSettersService } from './product-visits-setters.service';
import { Product, ProductVisit } from '../../entities';
import { ProductsGettersService } from '../products/products-getters.service';
import { ProductsSettersService } from '../products/products-setters.service';

/**
 * Unit tests for {@link ProductVisitsSettersService}.
 */
describe('ProductVisitsSettersService', () => {
  const repositoryMock = {
    save: jest.fn(),
  };
  const productsGettersServiceMock = {
    findOne: jest.fn(),
  };
  const productsSettersServiceMock = {
    incrementVisits: jest.fn().mockResolvedValue(undefined),
  };
  let service: ProductVisitsSettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductVisitsSettersService,
        {
          provide: getRepositoryToken(ProductVisit),
          useValue: repositoryMock,
        },
        {
          provide: ProductsGettersService,
          useValue: productsGettersServiceMock,
        },
        {
          provide: ProductsSettersService,
          useValue: productsSettersServiceMock,
        },
      ],
    }).compile();
    service = moduleRef.get(ProductVisitsSettersService);
  });

  describe('create', () => {
    it('saves visit and increments product visits', async () => {
      const product = { id: 5, visits: 3 } as Product;
      const saved = { id: 1, idProduct: 5 } as ProductVisit;
      productsGettersServiceMock.findOne.mockResolvedValue(product);
      repositoryMock.save.mockResolvedValue(saved);
      await service.create({ idProduct: 5 }, { userId: 9, username: 'u' });
      expect(productsGettersServiceMock.findOne).toHaveBeenCalledWith(5);
      expect(repositoryMock.save).toHaveBeenCalled();
      expect(productsSettersServiceMock.incrementVisits).toHaveBeenCalledWith(
        product,
      );
    });
    it('throws InternalServerErrorException when save fails', async () => {
      const product = { id: 1 } as Product;
      productsGettersServiceMock.findOne.mockResolvedValue(product);
      repositoryMock.save.mockRejectedValue(new Error('db'));
      await expect(
        service.create({ idProduct: 1 }, { userId: 1, username: 'a' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
