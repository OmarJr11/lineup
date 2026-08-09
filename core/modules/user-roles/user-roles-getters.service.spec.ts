import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from '../../entities';
import { UserRolesGettersService } from './user-roles-getters.service';

/**
 * Unit tests for {@link UserRolesGettersService}.
 */
describe('UserRolesGettersService', () => {
  let service: UserRolesGettersService;
  const findOneMock = jest.fn();
  const findOneOrFailMock = jest.fn();
  const findMock = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UserRolesGettersService,
        {
          provide: getRepositoryToken(UserRole),
          useValue: {
            findOne: findOneMock,
            findOneOrFail: findOneOrFailMock,
            find: findMock,
          },
        },
      ],
    }).compile();
    service = moduleRef.get(UserRolesGettersService);
  });

  describe('findOne', () => {
    it('returns a user role when found', async () => {
      const ur = { idUser: 1, idRole: 2 } as UserRole;
      findOneMock.mockResolvedValue(ur);
      await expect(service.findOne(1, 2)).resolves.toBe(ur);
      expect(findOneMock).toHaveBeenCalledWith({
        where: { idUser: 1, idRole: 2 },
        relations: ['role'],
      });
    });
  });

  describe('findOneOrFail', () => {
    it('returns entity when repository succeeds', async () => {
      const ur = { idUser: 3, idRole: 4 } as UserRole;
      findOneOrFailMock.mockResolvedValue(ur);
      await expect(service.findOneOrFail(3, 4)).resolves.toBe(ur);
    });

    it('throws NotFoundException when repository fails', async () => {
      findOneOrFailMock.mockRejectedValue(new Error('nf'));
      await expect(service.findOneOrFail(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllByUserId', () => {
    it('returns roles for user', async () => {
      const list = [{ idUser: 5 } as UserRole];
      findMock.mockResolvedValue(list);
      await expect(service.findAllByUserId(5)).resolves.toBe(list);
    });

    it('throws NotFoundException when find fails', async () => {
      findMock.mockRejectedValue(new Error('db'));
      await expect(service.findAllByUserId(5)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
