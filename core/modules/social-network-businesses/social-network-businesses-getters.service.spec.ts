import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SocialNetworkBusinessesGettersService } from './social-network-businesses-getters.service';
import { SocialNetworkBusiness } from '../../entities';

/**
 * Unit tests for {@link SocialNetworkBusinessesGettersService}.
 */
describe('SocialNetworkBusinessesGettersService', () => {
  const repositoryMock = {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  let service: SocialNetworkBusinessesGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SocialNetworkBusinessesGettersService,
        {
          provide: getRepositoryToken(SocialNetworkBusiness),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(SocialNetworkBusinessesGettersService);
  });

  describe('findOne', () => {
    it('returns row when found', async () => {
      const row = { id: 1 } as SocialNetworkBusiness;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findOne(1)).resolves.toBe(row);
    });
    it('throws NotFoundException when missing', async () => {
      repositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(service.findOne(9)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByBusiness', () => {
    it('returns rows from query builder', async () => {
      const rows = [{ id: 2 } as SocialNetworkBusiness];
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rows),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(service.findByBusiness(5)).resolves.toBe(rows);
    });
  });

  describe('checkIfExistsByIdBusinessAndSocialNetwork', () => {
    it('returns true when a row exists', async () => {
      repositoryMock.findOne.mockResolvedValue({ id: 1 });
      await expect(
        service.checkIfExistsByIdBusinessAndSocialNetwork(1, 2),
      ).resolves.toBe(true);
    });
    it('returns false when no row exists', async () => {
      repositoryMock.findOne.mockResolvedValue(null);
      await expect(
        service.checkIfExistsByIdBusinessAndSocialNetwork(1, 2),
      ).resolves.toBe(false);
    });
    it('throws NotFoundException when findOne fails', async () => {
      repositoryMock.findOne.mockRejectedValue(new Error('db'));
      await expect(
        service.checkIfExistsByIdBusinessAndSocialNetwork(1, 2),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
