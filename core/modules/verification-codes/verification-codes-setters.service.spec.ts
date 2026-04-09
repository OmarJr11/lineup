jest.mock('typeorm-transactional-cls-hooked', () => {
  const actual =
    jest.requireActual<typeof import('typeorm-transactional-cls-hooked')>(
      'typeorm-transactional-cls-hooked',
    );
  return {
    ...actual,
    Transactional:
      () =>
      (
        _target: object,
        _propertyKey: string | symbol,
        descriptor: PropertyDescriptor,
      ): PropertyDescriptor =>
        descriptor,
  };
});

import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VerificationCode } from '../../entities/verification-code.entity';
import { VerificationCodesSettersService } from './verification-codes-setters.service';
import { CreateVerificationCodeDto } from './dto/create-verification-code.dto';
import { VerificationCodeChannelEnum } from '../../common/enums';
import type { IUserReq } from '../../common/interfaces';

/**
 * Unit tests for {@link VerificationCodesSettersService}.
 */
describe('VerificationCodesSettersService', () => {
  let service: VerificationCodesSettersService;
  const saveMock = jest.fn();
  const userReq = { userId: 1, username: 'u' } as IUserReq;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationCodesSettersService,
        {
          provide: getRepositoryToken(VerificationCode),
          useValue: {
            save: saveMock,
            metadata: { columns: [] },
          },
        },
      ],
    }).compile();
    service = moduleRef.get(VerificationCodesSettersService);
  });

  describe('createVerificationCode', () => {
    it('persists record with generated code', async () => {
      const input: CreateVerificationCodeDto = {
        channel: VerificationCodeChannelEnum.EMAIL,
      };
      const saved = { id: 9, code: '100000' } as VerificationCode;
      saveMock.mockResolvedValue(saved);
      await expect(
        service.createVerificationCode(input, userReq),
      ).resolves.toBe(saved);
      expect(saveMock).toHaveBeenCalled();
    });

    it('throws InternalServerErrorException when save fails', async () => {
      saveMock.mockRejectedValue(new Error('db'));
      await expect(
        service.createVerificationCode(
          { channel: VerificationCodeChannelEnum.EMAIL },
          userReq,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('verifyCode', () => {
    it('throws when record is expired', async () => {
      const past = new Date(Date.now() - 1000);
      const record = { id: 1, expiresAt: past } as VerificationCode;
      await expect(service.verifyCode(record, userReq)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
