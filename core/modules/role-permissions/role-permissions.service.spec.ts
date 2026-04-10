import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RolePermissionsService } from './role-permissions.service';
import { RolePermission } from '../../entities';

/**
 * Unit tests for {@link RolePermissionsService}.
 */
describe('RolePermissionsService', () => {
  const repositoryMock = {
    createQueryBuilder: jest.fn(),
  };
  let service: RolePermissionsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        RolePermissionsService,
        { provide: REQUEST, useValue: { headers: {}, user: { userId: 1 } } },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = await moduleRef.resolve(RolePermissionsService);
  });

  describe('getRolesPermissionsCodes', () => {
    it('returns unique permission codes for role ids', async () => {
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([{ code: 'a' }, { code: 'a' }, { code: 'b' }]),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(service.getRolesPermissionsCodes([1, 2])).resolves.toEqual([
        'a',
        'b',
      ]);
    });
  });
});
