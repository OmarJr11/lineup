import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../entities';
import { UsersSettersService } from './users.setters.service';
import type { CreateUserInput } from './dto/create-user.input';

/**
 * Unit tests for {@link UsersSettersService}.
 */
describe('UsersSettersService', () => {
  let service: UsersSettersService;
  const saveMock = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UsersSettersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            save: saveMock,
          },
        },
      ],
    }).compile();
    service = moduleRef.get(UsersSettersService);
  });

  describe('create', () => {
    it('returns persisted user when save succeeds', async () => {
      const created = { id: 3, username: 'new' } as User;
      saveMock.mockResolvedValue(created);
      const data = { email: 'a@a.com' } as CreateUserInput;
      await expect(service.create(data)).resolves.toBe(created);
      expect(saveMock).toHaveBeenCalled();
    });

    it('throws InternalServerErrorException when save fails', async () => {
      saveMock.mockRejectedValue(new Error('db'));
      await expect(
        service.create({} as CreateUserInput),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
