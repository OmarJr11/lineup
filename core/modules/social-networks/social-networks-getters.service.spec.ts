import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SocialNetworksGettersService } from './social-networks-getters.service';
import { SocialNetwork } from '../../entities';
import { SocialMediasEnum } from '../../common/enums';

/**
 * Unit tests for {@link SocialNetworksGettersService}.
 */
describe('SocialNetworksGettersService', () => {
  const repositoryMock = {
    findOneOrFail: jest.fn(),
    find: jest.fn(),
  };
  let service: SocialNetworksGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SocialNetworksGettersService,
        {
          provide: getRepositoryToken(SocialNetwork),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(SocialNetworksGettersService);
  });

  describe('findByCode', () => {
    it('returns row when found', async () => {
      const row = { id: 1, code: SocialMediasEnum.INSTAGRAM } as SocialNetwork;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(
        service.findByCode(SocialMediasEnum.INSTAGRAM),
      ).resolves.toBe(row);
    });
    it('throws NotFoundException when missing', async () => {
      repositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(
        service.findByCode(SocialMediasEnum.INSTAGRAM),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('returns row when found', async () => {
      const row = { id: 2 } as SocialNetwork;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findById(2)).resolves.toBe(row);
    });
  });

  describe('findAll', () => {
    it('returns rows from find', async () => {
      const rows = [{ id: 1 } as SocialNetwork];
      repositoryMock.find.mockResolvedValue(rows);
      await expect(service.findAll()).resolves.toBe(rows);
    });
    it('throws NotFoundException when find fails', async () => {
      repositoryMock.find.mockRejectedValue(new Error('db'));
      await expect(service.findAll()).rejects.toThrow(NotFoundException);
    });
  });
});
