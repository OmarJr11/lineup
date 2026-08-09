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
import { ValidationMail } from '../../entities/validation-mail.entity';
import { ValidationMailsSettersService } from './validation-mails-setters.service';

/**
 * Unit tests for {@link ValidationMailsSettersService}.
 */
describe('ValidationMailsSettersService', () => {
  let service: ValidationMailsSettersService;
  const saveMock = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ValidationMailsSettersService,
        {
          provide: getRepositoryToken(ValidationMail),
          useValue: {
            save: saveMock,
          },
        },
      ],
    }).compile();
    service = moduleRef.get(ValidationMailsSettersService);
  });

  describe('createValidationCode', () => {
    it('persists a new validation row', async () => {
      const saved = { id: 1, email: 'a@a.com' } as ValidationMail;
      saveMock.mockResolvedValue(saved);
      await expect(service.createValidationCode('a@a.com')).resolves.toBe(
        saved,
      );
      expect(saveMock).toHaveBeenCalled();
    });

    it('throws InternalServerErrorException when save fails', async () => {
      saveMock.mockRejectedValue(new Error('db'));
      await expect(
        service.createValidationCode('a@a.com'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('verifyCode', () => {
    it('throws BadRequestException when code expired', async () => {
      const past = new Date(Date.now() - 60_000);
      const record = { id: 1, expiresAt: past } as ValidationMail;
      await expect(service.verifyCode(record)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('marks record as used when still valid', async () => {
      const future = new Date(Date.now() + 60_000);
      const record = { id: 2, expiresAt: future } as ValidationMail;
      saveMock.mockResolvedValue({ ...record, isUsed: true });
      await expect(service.verifyCode(record)).resolves.toMatchObject({
        id: 2,
      });
    });
  });
});
