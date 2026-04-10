import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VerificationCode } from '../../entities/verification-code.entity';
import { VerificationCodesGettersService } from './verification-codes-getters.service';

/**
 * Unit tests for {@link VerificationCodesGettersService}.
 */
describe('VerificationCodesGettersService', () => {
  let service: VerificationCodesGettersService;
  const findOneOrFailMock = jest.fn();
  const findOneMock = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationCodesGettersService,
        {
          provide: getRepositoryToken(VerificationCode),
          useValue: {
            findOneOrFail: findOneOrFailMock,
            findOne: findOneMock,
          },
        },
      ],
    }).compile();
    service = moduleRef.get(VerificationCodesGettersService);
  });

  describe('findActiveByDestinationAndCode', () => {
    it('returns row when found', async () => {
      const row = { id: 1, code: '123456' } as VerificationCode;
      findOneOrFailMock.mockResolvedValue(row);
      await expect(service.findActiveByDestinationAndCode('123456')).resolves.toBe(
        row,
      );
    });

    it('throws NotFoundException when missing', async () => {
      findOneOrFailMock.mockRejectedValue(new Error('nf'));
      await expect(
        service.findActiveByDestinationAndCode('000000'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findActiveByOwner', () => {
    it('queries by idUser', async () => {
      findOneMock.mockResolvedValue(undefined);
      await service.findActiveByOwner({ idUser: 5 });
      expect(findOneMock).toHaveBeenCalled();
    });
  });
});
