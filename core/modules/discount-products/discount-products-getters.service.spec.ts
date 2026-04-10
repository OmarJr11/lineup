import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DiscountProductsGettersService } from './discount-products-getters.service';
import { DiscountProduct } from '../../entities';

/**
 * Unit tests for {@link DiscountProductsGettersService}.
 */
describe('DiscountProductsGettersService', () => {
  const repositoryMock = {
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  let service: DiscountProductsGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountProductsGettersService,
        {
          provide: getRepositoryToken(DiscountProduct),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(DiscountProductsGettersService);
  });

  describe('findByProductId', () => {
    it('returns entity when repository resolves', async () => {
      const row = { id: 1, idProduct: 5 } as DiscountProduct;
      repositoryMock.findOne.mockResolvedValue(row);
      await expect(service.findByProductId(5)).resolves.toBe(row);
    });
  });

  describe('findByProductIdWithDiscount', () => {
    it('returns row when query resolves', async () => {
      const row = { id: 1, idProduct: 5 } as DiscountProduct;
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOneOrFail: jest.fn().mockResolvedValue(row),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(service.findByProductIdWithDiscount(5)).resolves.toBe(row);
    });
    it('throws NotFoundException when getOneOrFail fails', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOneOrFail: jest.fn().mockRejectedValue(new Error('nf')),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(service.findByProductIdWithDiscount(9)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllByDiscountId', () => {
    it('returns list from repository.find', async () => {
      const list = [{ id: 1, idDiscount: 3 } as DiscountProduct];
      repositoryMock.find.mockResolvedValue(list);
      await expect(service.findAllByDiscountId(3)).resolves.toBe(list);
      expect(repositoryMock.find).toHaveBeenCalledWith({
        where: { idDiscount: 3 },
        relations: ['product', 'discount', 'creationBusiness'],
      });
    });
  });
});
