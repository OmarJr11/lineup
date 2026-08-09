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
import { ProductRatingsSettersService } from './product-ratings-setters.service';
import { ProductRating } from '../../entities';
import type { IUserReq } from '../../common/interfaces';

/**
 * Unit tests for {@link ProductRatingsSettersService}.
 */
describe('ProductRatingsSettersService', () => {
  const repositoryMock = {
    save: jest.fn(),
    update: jest.fn(),
    findOneOrFail: jest.fn(),
    metadata: {
      columns: [
        { propertyName: 'id' },
        { propertyName: 'idProduct' },
        { propertyName: 'idCreationUser' },
        { propertyName: 'stars' },
        { propertyName: 'comment' },
        { propertyName: 'status' },
      ],
    },
  };
  let service: ProductRatingsSettersService;
  const userReq: IUserReq = { userId: 7, username: 'u1' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductRatingsSettersService,
        {
          provide: getRepositoryToken(ProductRating),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(ProductRatingsSettersService);
  });

  describe('create', () => {
    it('persists rating via save', async () => {
      const saved = {
        id: 1,
        idProduct: 3,
        idCreationUser: 7,
        stars: 5,
      } as ProductRating;
      repositoryMock.save.mockResolvedValue(saved);
      const data = {
        idProduct: 3,
        idCreationUser: 7,
        stars: 5,
        comment: 'ok',
      };
      await expect(service.create(data, userReq)).resolves.toBe(saved);
    });
    it('throws InternalServerErrorException when save fails', async () => {
      repositoryMock.save.mockRejectedValue(new Error('db'));
      await expect(
        service.create(
          {
            idProduct: 1,
            idCreationUser: 7,
            stars: 4,
          },
          userReq,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    it('updates rating via updateEntity', async () => {
      const rating = { id: 9, idProduct: 1, idCreationUser: 7 } as ProductRating;
      const updated = { ...rating, stars: 3 } as ProductRating;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(updated);
      await expect(
        service.update(rating, { stars: 3, comment: 'x' }, userReq),
      ).resolves.toEqual(updated);
    });
  });
});
