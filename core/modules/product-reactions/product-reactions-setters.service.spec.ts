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
import { ProductReactionsSettersService } from './product-reactions-setters.service';
import { ProductReaction } from '../../entities';
import type { IUserReq } from '../../common/interfaces';
import { ReactionTypeEnum, StatusEnum } from '../../common/enums';

/**
 * Unit tests for {@link ProductReactionsSettersService}.
 */
describe('ProductReactionsSettersService', () => {
  const repositoryMock = {
    save: jest.fn(),
    update: jest.fn(),
    findOneOrFail: jest.fn(),
    remove: jest.fn(),
    metadata: {
      columns: [
        { propertyName: 'id' },
        { propertyName: 'idProduct' },
        { propertyName: 'type' },
        { propertyName: 'idCreationUser' },
        { propertyName: 'status' },
      ],
    },
  };
  let service: ProductReactionsSettersService;
  const userReq: IUserReq = { userId: 3, username: 'u1' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductReactionsSettersService,
        {
          provide: getRepositoryToken(ProductReaction),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(ProductReactionsSettersService);
  });

  describe('create', () => {
    it('persists reaction via save', async () => {
      const saved = {
        id: 1,
        idProduct: 10,
        type: ReactionTypeEnum.LIKE,
      } as ProductReaction;
      repositoryMock.save.mockResolvedValue(saved);
      const data = {
        idProduct: 10,
        type: ReactionTypeEnum.LIKE,
        idCreationUser: 3,
      };
      await expect(service.create(data, userReq)).resolves.toBe(saved);
    });
    it('throws InternalServerErrorException when save fails', async () => {
      repositoryMock.save.mockRejectedValue(new Error('db'));
      await expect(
        service.create(
          {
            idProduct: 1,
            type: ReactionTypeEnum.LIKE,
            idCreationUser: 3,
          },
          userReq,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    it('updates via updateEntity', async () => {
      const reaction = { id: 2 } as ProductReaction;
      const updated = {
        ...reaction,
        status: StatusEnum.INACTIVE,
      } as ProductReaction;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(updated);
      await expect(
        service.update(reaction, { status: StatusEnum.INACTIVE }, userReq),
      ).resolves.toEqual(updated);
    });
  });

  describe('remove', () => {
    it('removes entity via repository.remove', async () => {
      const reaction = { id: 5 } as ProductReaction;
      repositoryMock.remove.mockResolvedValue(reaction);
      await expect(service.remove(reaction, userReq)).resolves.toBe(reaction);
      expect(repositoryMock.remove).toHaveBeenCalledWith(reaction, {
        data: userReq,
      });
    });
  });
});
