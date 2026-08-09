import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LocationsGettersService } from './locations-getters.service';
import { Location } from '../../entities';

/**
 * Unit tests for {@link LocationsGettersService}.
 */
describe('LocationsGettersService', () => {
  const repositoryMock = {
    findOneOrFail: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  let service: LocationsGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsGettersService,
        {
          provide: getRepositoryToken(Location),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(LocationsGettersService);
  });

  describe('findAllMyLocations', () => {
    it('returns rows from query builder', async () => {
      const rows = [{ id: 1 } as Location];
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rows),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      const businessReq = { path: '/b', businessId: 5 };
      await expect(service.findAllMyLocations(businessReq)).resolves.toBe(
        rows,
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'l.idCreationBusiness = :idCreationBusiness',
        { idCreationBusiness: 5 },
      );
    });
  });

  describe('findOne', () => {
    it('returns entity when repository resolves', async () => {
      const row = { id: 2 } as Location;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findOne(2)).resolves.toBe(row);
    });
    it('throws NotFoundException when find fails', async () => {
      repositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
