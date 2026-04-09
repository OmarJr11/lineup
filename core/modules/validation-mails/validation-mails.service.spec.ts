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
import { ValidationMailsService } from './validation-mails.service';
import { ValidationMailsGettersService } from './validation-mails-getters.service';
import { ValidationMailsSettersService } from './validation-mails-setters.service';
import { ValidationMail } from '../../entities/validation-mail.entity';

/**
 * Unit tests for {@link ValidationMailsService}.
 */
describe('ValidationMailsService', () => {
  let service: ValidationMailsService;
  const gettersMock = {
    findActiveByEmailAndCode: jest.fn(),
  };
  const settersMock = {
    createValidationCode: jest.fn(),
    verifyCode: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ValidationMailsService(
      {} as Request,
      {} as Repository<ValidationMail>,
      gettersMock as unknown as ValidationMailsGettersService,
      settersMock as unknown as ValidationMailsSettersService,
    );
  });

  describe('createValidationCode', () => {
    it('delegates to setters', async () => {
      const row = { id: 1 } as ValidationMail;
      settersMock.createValidationCode.mockResolvedValue(row);
      await expect(service.createValidationCode('a@a.com')).resolves.toBe(row);
      expect(settersMock.createValidationCode).toHaveBeenCalledWith('a@a.com');
    });
  });

  describe('verifyCode', () => {
    it('loads record then verifies', async () => {
      const record = { id: 2 } as ValidationMail;
      gettersMock.findActiveByEmailAndCode.mockResolvedValue(record);
      settersMock.verifyCode.mockResolvedValue(record);
      await expect(
        service.verifyCode('a@a.com', '111111'),
      ).resolves.toBeUndefined();
      expect(gettersMock.findActiveByEmailAndCode).toHaveBeenCalledWith(
        'a@a.com',
        '111111',
      );
      expect(settersMock.verifyCode).toHaveBeenCalledWith(record);
    });
  });
});
