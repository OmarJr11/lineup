import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessRolesGettersService } from './business-roles-getters.service';
import { BusinessRole } from '../../entities';

/**
 * Unit tests for {@link BusinessRolesGettersService}.
 */
describe('BusinessRolesGettersService', () => {
  const repositoryMock = {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    find: jest.fn(),
  };
  let service: BusinessRolesGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessRolesGettersService,
        { provide: REQUEST, useValue: {} },
        {
          provide: getRepositoryToken(BusinessRole),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(BusinessRolesGettersService);
  });

  describe('findOne', () => {
    it('returns repository result', async () => {
      const row = { idBusiness: 1, idRole: 2 } as BusinessRole;
      repositoryMock.findOne.mockResolvedValue(row);
      const result = await service.findOne(1, 2);
      expect(result).toBe(row);
      expect(repositoryMock.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { idBusiness: 1, idRole: 2 },
        }),
      );
    });
  });

  describe('findOneOrFail', () => {
    it('throws NotFoundException when repository fails', async () => {
      repositoryMock.findOneOrFail.mockRejectedValue(new Error('missing'));
      await expect(service.findOneOrFail(1, 2)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllByBusinessId', () => {
    it('loads all rows for the business with role relation', async () => {
      const list: BusinessRole[] = [];
      repositoryMock.find.mockResolvedValue(list);
      const result = await service.findAllByBusinessId(5);
      expect(result).toBe(list);
      expect(repositoryMock.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { idBusiness: 5 },
          relations: ['role'],
        }),
      );
    });
  });
});
