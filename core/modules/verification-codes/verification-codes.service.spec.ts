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

import type { Repository } from 'typeorm';
import type { Request } from 'express';
import { VerificationCodesService } from './verification-codes.service';
import { VerificationCodesGettersService } from './verification-codes-getters.service';
import { VerificationCodesSettersService } from './verification-codes-setters.service';
import { VerificationCodesMailService } from './verification-codes-mail.service';
import { UsersGettersService } from '../users/users.getters.service';
import { BusinessesGettersService } from '../businesses/businesses-getters.service';
import { VerificationCode } from '../../entities/verification-code.entity';
import { CreateVerificationCodeDto } from './dto/create-verification-code.dto';
import { VerifyVerificationCodeDto } from './dto/verify-verification-code.dto';
import { VerificationCodeChannelEnum } from '../../common/enums';
import type { IUserReq } from '../../common/interfaces';

/**
 * Unit tests for {@link VerificationCodesService}.
 */
describe('VerificationCodesService', () => {
  let service: VerificationCodesService;
  const gettersMock = {
    findActiveByDestinationAndCode: jest.fn(),
    findActiveByOwner: jest.fn(),
  };
  const settersMock = {
    createVerificationCode: jest.fn(),
    verifyCode: jest.fn(),
  };
  const mailMock = {
    sendVerificationCodeEmail: jest.fn(),
  };
  const usersGettersMock = {
    findOne: jest.fn(),
  };
  const businessesGettersMock = {
    findOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VerificationCodesService(
      {} as Request,
      {} as Repository<VerificationCode>,
      gettersMock as unknown as VerificationCodesGettersService,
      settersMock as unknown as VerificationCodesSettersService,
      mailMock as unknown as VerificationCodesMailService,
      usersGettersMock as unknown as UsersGettersService,
      businessesGettersMock as unknown as BusinessesGettersService,
    );
  });

  describe('createVerificationCode', () => {
    it('returns early when a non-expired code already exists for user', async () => {
      const userReq = { userId: 2, username: 'u' } as IUserReq;
      usersGettersMock.findOne.mockResolvedValue({
        id: 2,
        email: 'u@u.com',
      });
      gettersMock.findActiveByOwner.mockResolvedValue({
        expiresAt: new Date(Date.now() + 120_000),
      });
      const input: CreateVerificationCodeDto = {
        channel: VerificationCodeChannelEnum.EMAIL,
      };
      await expect(
        service.createVerificationCode(input, userReq, true),
      ).resolves.toBeUndefined();
      expect(settersMock.createVerificationCode).not.toHaveBeenCalled();
    });

    it('creates code and sends email for user EMAIL channel', async () => {
      const userReq = { userId: 3, username: 'u' } as IUserReq;
      usersGettersMock.findOne.mockResolvedValue({
        id: 3,
        email: 'user@test.com',
      });
      gettersMock.findActiveByOwner.mockResolvedValue(undefined);
      const created = {
        id: 10,
        destination: 'user@test.com',
        code: '200000',
      } as VerificationCode;
      settersMock.createVerificationCode.mockResolvedValue(created);
      const input: CreateVerificationCodeDto = {
        channel: VerificationCodeChannelEnum.EMAIL,
      };
      await service.createVerificationCode(input, userReq, true);
      expect(mailMock.sendVerificationCodeEmail).toHaveBeenCalledWith(created);
    });
  });

  describe('verifyCode', () => {
    it('verifies EMAIL code when destination matches user email', async () => {
      const userReq = { userId: 4, username: 'u' } as IUserReq;
      const record = {
        channel: VerificationCodeChannelEnum.EMAIL,
        destination: 'match@test.com',
        code: '654321',
      } as VerificationCode;
      gettersMock.findActiveByDestinationAndCode.mockResolvedValue(record);
      usersGettersMock.findOne.mockResolvedValue({
        id: 4,
        email: 'match@test.com',
      });
      const updated = { ...record, isUsed: true } as VerificationCode;
      settersMock.verifyCode.mockResolvedValue(updated);
      const data: VerifyVerificationCodeDto = { code: '654321' };
      await expect(
        service.verifyCode(data, userReq, true),
      ).resolves.toBe(updated);
      expect(settersMock.verifyCode).toHaveBeenCalledWith(record, userReq);
    });
  });
});
