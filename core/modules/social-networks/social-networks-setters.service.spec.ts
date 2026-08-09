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
import { SocialNetworksSettersService } from './social-networks-setters.service';
import { SocialNetwork } from '../../entities';
import { SocialMediasEnum, StatusEnum } from '../../common/enums';
import type { IUserReq } from '../../common/interfaces';

/**
 * Unit tests for {@link SocialNetworksSettersService}.
 */
describe('SocialNetworksSettersService', () => {
  const repositoryMock = {
    save: jest.fn(),
    update: jest.fn(),
    findOneOrFail: jest.fn(),
    metadata: {
      columns: [
        { propertyName: 'id' },
        { propertyName: 'name' },
        { propertyName: 'code' },
        { propertyName: 'imageCode' },
        { propertyName: 'status' },
        { propertyName: 'idCreationUser' },
      ],
    },
  };
  let service: SocialNetworksSettersService;
  const userReq: IUserReq = { userId: 7, username: 'admin' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SocialNetworksSettersService,
        {
          provide: getRepositoryToken(SocialNetwork),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(SocialNetworksSettersService);
  });

  describe('create', () => {
    it('persists via save', async () => {
      const saved = {
        id: 10,
        name: 'Instagram',
        code: SocialMediasEnum.INSTAGRAM,
      } as SocialNetwork;
      repositoryMock.save.mockResolvedValue(saved);
      const data = {
        name: 'Instagram',
        code: SocialMediasEnum.INSTAGRAM,
        imageCode: 'img',
      };
      await expect(service.create(data, userReq)).resolves.toBe(saved);
    });
    it('throws InternalServerErrorException when save fails', async () => {
      repositoryMock.save.mockRejectedValue(new Error('db'));
      await expect(
        service.create(
          {
            name: 'X',
            code: SocialMediasEnum.FACEBOOK,
            imageCode: 'i',
          },
          userReq,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    it('updates entity via updateEntity', async () => {
      const entity = { id: 3, name: 'Old' } as SocialNetwork;
      const updated = { id: 3, name: 'New' } as SocialNetwork;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(updated);
      await expect(
        service.update({ id: 3, name: 'New' }, entity, userReq),
      ).resolves.toBe(updated);
    });
  });

  describe('remove', () => {
    it('soft-deletes via status update', async () => {
      const entity = { id: 4 } as SocialNetwork;
      const reloaded = {
        ...entity,
        status: StatusEnum.DELETED,
      } as SocialNetwork;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(reloaded);
      await expect(service.remove(entity, userReq)).resolves.toBeUndefined();
    });
  });
});
