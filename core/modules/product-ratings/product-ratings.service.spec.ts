jest.mock('typeorm-transactional-cls-hooked', () => {
  const actual = jest.requireActual<
    typeof import('typeorm-transactional-cls-hooked')
  >('typeorm-transactional-cls-hooked');
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
import { ProductRatingsService } from './product-ratings.service';
import { ProductRatingsGettersService } from './product-ratings-getters.service';
import { ProductRatingsSettersService } from './product-ratings-setters.service';
import { ProductsGettersService } from '../products/products-getters.service';
import { ProductRating } from '../../entities';
import type { Product } from '../../entities';
import type { IUserReq } from '../../common/interfaces';
import {
  NotificationsConsumerEnum,
  NotificationTypeEnum,
  QueueNamesEnum,
  ReviewsConsumerEnum,
} from '../../common/enums';
import { NotificationContentScenarioEnum } from '../../common/enums/notification-content-scenario.enum';

/**
 * Unit tests for {@link ProductRatingsService}.
 */
describe('ProductRatingsService', () => {
  const productRatingsGettersServiceMock = {
    findOneByProductAndUser: jest.fn(),
    findOne: jest.fn(),
  };
  const productRatingsSettersServiceMock = {
    create: jest.fn(),
    update: jest.fn(),
  };
  const productsGettersServiceMock = {
    findOne: jest.fn(),
    findCatalogByProductId: jest.fn(),
  };
  const reviewsQueueMock = {
    add: jest.fn().mockResolvedValue(undefined),
  };
  const notificationsQueueMock = {
    add: jest.fn().mockResolvedValue(undefined),
  };
  let service: ProductRatingsService;
  const userReq: IUserReq = { userId: 10, username: 'buyer' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductRatingsService,
        { provide: REQUEST, useValue: {} },
        {
          provide: getRepositoryToken(ProductRating),
          useValue: {},
        },
        {
          provide: ProductRatingsGettersService,
          useValue: productRatingsGettersServiceMock,
        },
        {
          provide: ProductRatingsSettersService,
          useValue: productRatingsSettersServiceMock,
        },
        {
          provide: ProductsGettersService,
          useValue: productsGettersServiceMock,
        },
        {
          provide: getQueueToken(QueueNamesEnum.reviews),
          useValue: reviewsQueueMock,
        },
        {
          provide: getQueueToken(QueueNamesEnum.notifications),
          useValue: notificationsQueueMock,
        },
      ],
    }).compile();
    service = moduleRef.get(ProductRatingsService);
  });

  describe('rateProduct', () => {
    it('creates rating, notifies business, syncs average, returns loaded rating', async () => {
      const product = {
        id: 100,
        title: 'Cool item',
        idCreationBusiness: 500,
      } as Product;
      const created = { id: 1, idProduct: 100 } as ProductRating;
      const loaded = {
        id: 1,
        idProduct: 100,
        creationUser: {},
      } as ProductRating;
      productsGettersServiceMock.findOne.mockResolvedValue(product);
      productsGettersServiceMock.findCatalogByProductId.mockResolvedValue({
        path: '/summer-sale',
      });
      productRatingsGettersServiceMock.findOneByProductAndUser.mockResolvedValue(
        null,
      );
      productRatingsSettersServiceMock.create.mockResolvedValue(created);
      productRatingsGettersServiceMock.findOne.mockResolvedValue(loaded);
      const input = { idProduct: 100, stars: 5, comment: 'great' };
      await expect(service.rateProduct(input, userReq)).resolves.toBe(loaded);
      expect(productRatingsSettersServiceMock.create).toHaveBeenCalled();
      expect(notificationsQueueMock.add).toHaveBeenCalledWith(
        NotificationsConsumerEnum.CreateForBusiness,
        expect.objectContaining({
          scenario: NotificationContentScenarioEnum.NEW_PRODUCT_REVIEW,
          type: NotificationTypeEnum.INFO,
          data: {
            id: 100,
            productTitle: 'Cool item',
            catalogPath: '/summer-sale',
          },
        }),
      );
      expect(reviewsQueueMock.add).toHaveBeenCalledWith(
        ReviewsConsumerEnum.CalculateAverage,
        { idProduct: 100, user: userReq },
      );
      expect(productRatingsGettersServiceMock.findOne).toHaveBeenCalledWith(1);
    });
    it('does not enqueue business notification when product has no creation business', async () => {
      const product = { id: 101, idCreationBusiness: undefined } as Product;
      const created = { id: 2, idProduct: 101 } as ProductRating;
      const loaded = { id: 2 } as ProductRating;
      productsGettersServiceMock.findOne.mockResolvedValue(product);
      productRatingsGettersServiceMock.findOneByProductAndUser.mockResolvedValue(
        null,
      );
      productRatingsSettersServiceMock.create.mockResolvedValue(created);
      productRatingsGettersServiceMock.findOne.mockResolvedValue(loaded);
      await service.rateProduct(
        { idProduct: 101, stars: 4, comment: '' },
        userReq,
      );
      expect(notificationsQueueMock.add).not.toHaveBeenCalled();
      expect(reviewsQueueMock.add).toHaveBeenCalled();
    });
    it('updates existing rating and skips new-review notification', async () => {
      const product = { id: 102, idCreationBusiness: 1 } as Product;
      const existing = { id: 8, idProduct: 102 } as ProductRating;
      const updated = { id: 8, stars: 2 } as ProductRating;
      const loaded = { id: 8 } as ProductRating;
      productsGettersServiceMock.findOne.mockResolvedValue(product);
      productRatingsGettersServiceMock.findOneByProductAndUser.mockResolvedValue(
        existing,
      );
      productRatingsSettersServiceMock.update.mockResolvedValue(updated);
      productRatingsGettersServiceMock.findOne.mockResolvedValue(loaded);
      await expect(
        service.rateProduct(
          { idProduct: 102, stars: 2, comment: 'meh' },
          userReq,
        ),
      ).resolves.toBe(loaded);
      expect(productRatingsSettersServiceMock.update).toHaveBeenCalled();
      expect(productRatingsSettersServiceMock.create).not.toHaveBeenCalled();
      expect(notificationsQueueMock.add).not.toHaveBeenCalled();
      expect(reviewsQueueMock.add).toHaveBeenCalledWith(
        ReviewsConsumerEnum.CalculateAverage,
        expect.any(Object),
      );
    });
  });
});
