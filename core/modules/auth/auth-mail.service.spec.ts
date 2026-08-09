import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { AuthMailService } from './auth-mail.service';
import { QueueNamesEnum } from '../../common/enums/consumers';
import { MailsConsumerEnum } from '../../common/enums/consumers';
import { TemplatesEnum } from '../../common/enums';
import { ValidationMailsSettersService } from '../validation-mails/validation-mails-setters.service';
import { ValidationMailsGettersService } from '../validation-mails/validation-mails-getters.service';
import type { ValidationMail } from '../../entities';

/**
 * Unit tests for {@link AuthMailService}.
 */
describe('AuthMailService', () => {
  const mailsQueueAddMock = jest.fn();
  const mailsQueueMock = {
    add: mailsQueueAddMock,
  };
  const validationMailsSettersServiceMock = {
    createValidationCode: jest.fn(),
    verifyCode: jest.fn(),
  };
  const validationMailsGettersServiceMock = {
    findLatestByEmail: jest.fn(),
    findActiveByEmailAndCode: jest.fn(),
  };
  let service: AuthMailService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthMailService,
        {
          provide: getQueueToken(QueueNamesEnum.mails),
          useValue: mailsQueueMock,
        },
        {
          provide: ValidationMailsSettersService,
          useValue: validationMailsSettersServiceMock,
        },
        {
          provide: ValidationMailsGettersService,
          useValue: validationMailsGettersServiceMock,
        },
      ],
    }).compile();
    service = moduleRef.get(AuthMailService);
  });

  describe('sendVerificationCodeEmail', () => {
    it('does nothing when a non-expired code already exists for the email', async () => {
      const activeRecord = {
        expiresAt: new Date(Date.now() + 60_000),
      } as ValidationMail;
      validationMailsGettersServiceMock.findLatestByEmail.mockResolvedValue(
        activeRecord,
      );
      await service.sendVerificationCodeEmail('user@example.com');
      expect(
        validationMailsSettersServiceMock.createValidationCode,
      ).not.toHaveBeenCalled();
      expect(mailsQueueAddMock).not.toHaveBeenCalled();
    });
    it('creates a code and enqueues mail when no record exists', async () => {
      validationMailsGettersServiceMock.findLatestByEmail.mockResolvedValue(
        null,
      );
      validationMailsSettersServiceMock.createValidationCode.mockResolvedValue({
        code: '123456',
      });
      await service.sendVerificationCodeEmail('new@example.com');
      expect(
        validationMailsSettersServiceMock.createValidationCode,
      ).toHaveBeenCalledWith('new@example.com');
      expect(mailsQueueAddMock).toHaveBeenCalledWith(
        MailsConsumerEnum.SendTemplateMail,
        expect.objectContaining({
          to: { email: 'new@example.com' },
          template: TemplatesEnum.VERIFY_EMAIL,
          context: expect.objectContaining({
            code: '123456',
            expiresIn: '10 minutes',
          }),
        }),
      );
    });
    it('creates a code when the latest record is expired', async () => {
      const expiredRecord = {
        expiresAt: new Date(Date.now() - 60_000),
      } as ValidationMail;
      validationMailsGettersServiceMock.findLatestByEmail.mockResolvedValue(
        expiredRecord,
      );
      validationMailsSettersServiceMock.createValidationCode.mockResolvedValue({
        code: '999999',
      });
      await service.sendVerificationCodeEmail('old@example.com');
      expect(
        validationMailsSettersServiceMock.createValidationCode,
      ).toHaveBeenCalled();
      expect(mailsQueueAddMock).toHaveBeenCalled();
    });
  });

  describe('verifyCode', () => {
    it('delegates to getters and setters and returns the success response', async () => {
      const record = { id: 1 } as ValidationMail;
      validationMailsGettersServiceMock.findActiveByEmailAndCode.mockResolvedValue(
        record,
      );
      validationMailsSettersServiceMock.verifyCode.mockResolvedValue(undefined);
      const result = await service.verifyCode('a@b.com', '111111');
      expect(
        validationMailsGettersServiceMock.findActiveByEmailAndCode,
      ).toHaveBeenCalledWith('a@b.com', '111111');
      expect(validationMailsSettersServiceMock.verifyCode).toHaveBeenCalledWith(
        record,
      );
      expect(result).toEqual(
        expect.objectContaining({
          status: true,
        }),
      );
    });
  });
});
