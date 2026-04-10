import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RolesPermissionsCheckerService } from './roles-permissions-checker.service';
import { Role, RolePermission } from '../../entities';

/**
 * Unit tests for {@link RolesPermissionsCheckerService}.
 */
describe('RolesPermissionsCheckerService', () => {
  const roleRepositoryMock = {
    createQueryBuilder: jest.fn(),
  };
  const rolePermissionRepositoryMock = {
    createQueryBuilder: jest.fn(),
  };
  let service: RolesPermissionsCheckerService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        RolesPermissionsCheckerService,
        {
          provide: getRepositoryToken(Role),
          useValue: roleRepositoryMock,
        },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: rolePermissionRepositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(RolesPermissionsCheckerService);
  });

  describe('userHasPermission', () => {
    it('returns false when user has no roles', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      roleRepositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(
        service.userHasPermission(1, ['perm.a']),
      ).resolves.toBe(false);
    });
    it('returns true when a role grants one of the codes', async () => {
      const roleQb = {
        select: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 10 }]),
      };
      const permQb = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([{ code: 'perm.a' }, { code: 'other' }]),
      };
      roleRepositoryMock.createQueryBuilder.mockReturnValue(roleQb);
      rolePermissionRepositoryMock.createQueryBuilder.mockReturnValue(permQb);
      await expect(
        service.userHasPermission(2, ['perm.a']),
      ).resolves.toBe(true);
    });
  });

  describe('businessHasPermission', () => {
    it('returns false when business has no roles', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      roleRepositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(
        service.businessHasPermission(3, ['z']),
      ).resolves.toBe(false);
    });
    it('returns true when a business role grants a matching code', async () => {
      const roleQb = {
        select: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 7 }]),
      };
      const permQb = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ code: 'catalog.read' }]),
      };
      roleRepositoryMock.createQueryBuilder.mockReturnValue(roleQb);
      rolePermissionRepositoryMock.createQueryBuilder.mockReturnValue(permQb);
      await expect(
        service.businessHasPermission(4, ['catalog.read']),
      ).resolves.toBe(true);
    });
  });
});
