import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { RolesPermissionsCheckerService } from './roles-permissions-checker.service';
import { Role } from '../../entities';
import { RolesCodesEnum } from '../../common/enums';

/**
 * Unit tests for {@link RolesService}.
 */
describe('RolesService', () => {
  const repositoryMock = {
    findOneOrFail: jest.fn(),
  };
  const rolesPermissionsCheckerMock = {
    userHasPermission: jest.fn(),
    businessHasPermission: jest.fn(),
  };
  let service: RolesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: REQUEST, useValue: {} },
        {
          provide: getRepositoryToken(Role),
          useValue: repositoryMock,
        },
        {
          provide: RolesPermissionsCheckerService,
          useValue: rolesPermissionsCheckerMock,
        },
      ],
    }).compile();
    service = await moduleRef.resolve(RolesService);
  });

  describe('findByCode', () => {
    it('returns role when repository resolves', async () => {
      const role = { id: 1, code: RolesCodesEnum.ADMIN } as Role;
      repositoryMock.findOneOrFail.mockResolvedValue(role);
      await expect(service.findByCode(RolesCodesEnum.ADMIN)).resolves.toBe(role);
    });
    it('throws NotFoundException when role is missing', async () => {
      repositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(service.findByCode(RolesCodesEnum.ADMIN)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('userHasPermission', () => {
    it('delegates to RolesPermissionsCheckerService', async () => {
      rolesPermissionsCheckerMock.userHasPermission.mockResolvedValue(true);
      await expect(
        service.userHasPermission(5, ['code1']),
      ).resolves.toBe(true);
      expect(rolesPermissionsCheckerMock.userHasPermission).toHaveBeenCalledWith(
        5,
        ['code1'],
      );
    });
  });

  describe('businessHasPermission', () => {
    it('delegates to RolesPermissionsCheckerService', async () => {
      rolesPermissionsCheckerMock.businessHasPermission.mockResolvedValue(false);
      await expect(
        service.businessHasPermission(9, ['x']),
      ).resolves.toBe(false);
      expect(
        rolesPermissionsCheckerMock.businessHasPermission,
      ).toHaveBeenCalledWith(9, ['x']);
    });
  });
});
