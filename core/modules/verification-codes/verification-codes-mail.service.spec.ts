import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { VerificationCodesMailService } from './verification-codes-mail.service';
import { VerificationCode } from '../../entities/verification-code.entity';
import { QueueNamesEnum, MailsConsumerEnum } from '../../common/enums';

/**
 * Unit tests for {@link VerificationCodesMailService}.
 */
describe('VerificationCodesMailService', () => {
  let service: VerificationCodesMailService;
  const addMock = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationCodesMailService,
        {
          provide: getQueueToken(QueueNamesEnum.mails),
          useValue: { add: addMock },
        },
      ],
    }).compile();
    service = moduleRef.get(VerificationCodesMailService);
  });

  describe('sendVerificationCodeEmail', () => {
    it('enqueues template mail job', async () => {
      addMock.mockResolvedValue(undefined);
      const record = {
        destination: 'a@a.com',
        code: '123456',
      } as VerificationCode;
      await expect(
        service.sendVerificationCodeEmail(record),
      ).resolves.toBeUndefined();
      expect(addMock).toHaveBeenCalledWith(
        MailsConsumerEnum.SendTemplateMail,
        expect.objectContaining({
          to: { email: 'a@a.com' },
          context: expect.objectContaining({ code: '123456' }),
        }),
      );
    });
  });
});
