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
import { REQUEST } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { ProductReactionsService } from './product-reactions.service';
import { ProductReactionsGettersService } from './product-reactions-getters.service';
import { ProductReactionsSettersService } from './product-reactions-setters.service';
import { ProductsGettersService } from '../products/products-getters.service';
import { ProductsSettersService } from '../products/products-setters.service';
import { Product, ProductReaction } from '../../entities';
import type { IUserReq } from '../../common/interfaces';
import {
  QueueNamesEnum,
  ReactionTypeEnum,
  SearchDataConsumerEnum,
} from '../../common/enums';

/**
 * Unit tests for {@link ProductReactionsService}.
 */
describe('ProductReactionsService', () => {
  const productReactionsGettersServiceMock = {
    findOneByProductAndUser: jest.fn(),
    findOne: jest.fn(),
  };
  const productReactionsSettersServiceMock = {
    create: jest.fn(),
    remove: jest.fn(),
  };
  const productsGettersServiceMock = {
    findOne: jest.fn(),
  };
  const productsSettersServiceMock = {
    incrementLikes: jest.fn().mockResolvedValue(undefined),
    decrementLikes: jest.fn().mockResolvedValue(undefined),
  };
  const searchDataQueueMock = {
    add: jest.fn().mockResolvedValue(undefined),
  };
  let service: ProductReactionsService;
  const userReq: IUserReq = { userId: 11, username: 'u1' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductReactionsService,
        { provide: REQUEST, useValue: {} },
        {
          provide: getRepositoryToken(ProductReaction),
          useValue: {},
        },
        {
          provide: ProductReactionsGettersService,
          useValue: productReactionsGettersServiceMock,
        },
        {
          provide: ProductReactionsSettersService,
          useValue: productReactionsSettersServiceMock,
        },
        {
          provide: ProductsGettersService,
          useValue: productsGettersServiceMock,
        },
        {
          provide: ProductsSettersService,
          useValue: productsSettersServiceMock,
        },
        {
          provide: getQueueToken(QueueNamesEnum.searchData),
          useValue: searchDataQueueMock,
        },
      ],
    }).compile();
    service = moduleRef.get(ProductReactionsService);
  });

  describe('likeProduct', () => {
    it('returns existing reaction without creating or enqueueing search job', async () => {
      const product = { id: 100 } as Product;
      const existing = { id: 1, idProduct: 100 } as ProductReaction;
      productsGettersServiceMock.findOne.mockResolvedValue(product);
      productReactionsGettersServiceMock.findOneByProductAndUser.mockResolvedValue(
        existing,
      );
      await expect(service.likeProduct(100, userReq)).resolves.toBe(existing);
      expect(productReactionsSettersServiceMock.create).not.toHaveBeenCalled();
      expect(searchDataQueueMock.add).not.toHaveBeenCalled();
    });
    it('creates like, enqueues search job, and returns loaded reaction', async () => {
      const product = { id: 200 } as Product;
      const created = { id: 5, idProduct: 200 } as ProductReaction;
      const loaded = { id: 5, idProduct: 200 } as ProductReaction;
      productsGettersServiceMock.findOne.mockResolvedValue(product);
      productReactionsGettersServiceMock.findOneByProductAndUser.mockResolvedValue(
        null,
      );
      productReactionsSettersServiceMock.create.mockResolvedValue(created);
      productReactionsGettersServiceMock.findOne.mockResolvedValue(loaded);
      await expect(service.likeProduct(200, userReq)).resolves.toBe(loaded);
      expect(productReactionsSettersServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          idProduct: 200,
          type: ReactionTypeEnum.LIKE,
          idCreationUser: userReq.userId,
        }),
        userReq,
      );
      expect(productsSettersServiceMock.incrementLikes).toHaveBeenCalledWith(
        product,
        userReq,
      );
      expect(searchDataQueueMock.add).toHaveBeenCalledWith(
        SearchDataConsumerEnum.SearchDataProductLikeRecord,
        { idProduct: 200, action: 'like' },
      );
      expect(productReactionsGettersServiceMock.findOne).toHaveBeenCalledWith(5);
    });
  });

  describe('unlikeProduct', () => {
    it('returns true when user had not liked the product', async () => {
      const product = { id: 300 } as Product;
      productsGettersServiceMock.findOne.mockResolvedValue(product);
      productReactionsGettersServiceMock.findOneByProductAndUser.mockResolvedValue(
        null,
      );
      await expect(service.unlikeProduct(300, userReq)).resolves.toBe(true);
      expect(productReactionsSettersServiceMock.remove).not.toHaveBeenCalled();
    });
    it('removes reaction, decrements likes, and enqueues unlike search job', async () => {
      const product = { id: 400 } as Product;
      const existing = { id: 9, idProduct: 400 } as ProductReaction;
      productsGettersServiceMock.findOne.mockResolvedValue(product);
      productReactionsGettersServiceMock.findOneByProductAndUser.mockResolvedValue(
        existing,
      );
      productReactionsSettersServiceMock.remove.mockResolvedValue(undefined);
      await expect(service.unlikeProduct(400, userReq)).resolves.toBe(true);
      expect(productReactionsSettersServiceMock.remove).toHaveBeenCalledWith(
        existing,
        userReq,
      );
      expect(productsSettersServiceMock.decrementLikes).toHaveBeenCalledWith(
        product,
        userReq,
      );
      expect(searchDataQueueMock.add).toHaveBeenCalledWith(
        SearchDataConsumerEnum.SearchDataProductLikeRecord,
        { idProduct: 400, action: 'unlike' },
      );
    });
  });
});
