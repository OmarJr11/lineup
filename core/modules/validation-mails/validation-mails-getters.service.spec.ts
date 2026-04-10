import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ValidationMail } from '../../entities/validation-mail.entity';
import { ValidationMailsGettersService } from './validation-mails-getters.service';

/**
 * Unit tests for {@link ValidationMailsGettersService}.
 */
describe('ValidationMailsGettersService', () => {
  let service: ValidationMailsGettersService;
  const findOneOrFailMock = jest.fn();
  const findOneMock = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ValidationMailsGettersService,
        {
          provide: getRepositoryToken(ValidationMail),
          useValue: {
            findOneOrFail: findOneOrFailMock,
            findOne: findOneMock,
          },
        },
      ],
    }).compile();
    service = moduleRef.get(ValidationMailsGettersService);
  });

  describe('findActiveByEmailAndCode', () => {
    it('returns record when found', async () => {
      const row = { id: 1, email: 'a@a.com', code: '123456' } as ValidationMail;
      findOneOrFailMock.mockResolvedValue(row);
      await expect(
        service.findActiveByEmailAndCode('a@a.com', '123456'),
      ).resolves.toBe(row);
    });

    it('throws NotFoundException when missing', async () => {
      findOneOrFailMock.mockRejectedValue(new Error('nf'));
      await expect(
        service.findActiveByEmailAndCode('x@x.com', '000000'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findLatestByEmail', () => {
    it('delegates to findOneWithOptions', async () => {
      findOneMock.mockResolvedValue(undefined);
      await expect(service.findLatestByEmail('e@e.com')).resolves.toBeUndefined();
    });
  });
});
