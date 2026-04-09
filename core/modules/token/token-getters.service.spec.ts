import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Token } from '../../entities';
import { TokenGettersService } from './token-getters.service';

/**
 * Unit tests for {@link TokenGettersService}.
 */
describe('TokenGettersService', () => {
  let service: TokenGettersService;
  const findOneOrFailMock = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        TokenGettersService,
        {
          provide: getRepositoryToken(Token),
          useValue: {
            findOneOrFail: findOneOrFailMock,
          },
        },
      ],
    }).compile();
    service = moduleRef.get(TokenGettersService);
  });

  describe('findOneByTokenOrFail', () => {
    it('returns the token when repository finds it', async () => {
      const tokenEntity = { id: 1, token: 'jwt-value' } as Token;
      findOneOrFailMock.mockResolvedValue(tokenEntity);
      await expect(service.findOneByTokenOrFail('jwt-value')).resolves.toBe(
        tokenEntity,
      );
      expect(findOneOrFailMock).toHaveBeenCalledWith({
        where: { token: 'jwt-value' },
      });
    });

    it('throws NotFoundException when repository fails', async () => {
      findOneOrFailMock.mockRejectedValue(new Error('not found'));
      await expect(service.findOneByTokenOrFail('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
