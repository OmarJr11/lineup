jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

jest.mock('googleapis', () => {
  const sendMock = jest.fn();
  (
    globalThis as unknown as { __mailGmailSendMock: jest.Mock }
  ).__mailGmailSendMock = sendMock;
  return {
    google: {
      auth: {
        OAuth2: jest.fn().mockImplementation(() => ({
          setCredentials: jest.fn(),
        })),
      },
      gmail: jest.fn().mockReturnValue({
        users: {
          messages: {
            send: sendMock,
          },
        },
      }),
    },
  };
});

function getGmailSendMock(): jest.Mock {
  return (globalThis as unknown as { __mailGmailSendMock: jest.Mock })
    .__mailGmailSendMock;
}

import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';
import { MailSettersService } from './mail-setters.service';
import { MailTemplatesService } from './mail-templates.service';

/**
 * Unit tests for {@link MailSettersService}.
 */
describe('MailSettersService', () => {
  const configServiceMock = {
    get: jest.fn((key: string): string | undefined => {
      if (key === 'GMAIL_REFRESH_TOKEN') {
        return 'refresh';
      }
      if (key === 'GMAIL_SENDER_EMAIL') {
        return 'sender@example.com';
      }
      return undefined;
    }),
  };
  const mailTemplatesServiceMock = {
    renderTemplate: jest.fn().mockReturnValue('<p>body</p>'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (existsSync as jest.Mock).mockReturnValue(true);
    (readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify({
        web: { client_id: 'client-id', client_secret: 'client-secret' },
      }),
    );
    getGmailSendMock().mockResolvedValue({
      data: { id: 'msg-1', threadId: 'thread-1' },
    });
  });

  async function createService(): Promise<MailSettersService> {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        MailSettersService,
        { provide: ConfigService, useValue: configServiceMock },
        {
          provide: MailTemplatesService,
          useValue: mailTemplatesServiceMock,
        },
      ],
    }).compile();
    const service = moduleRef.get(MailSettersService);
    service.onModuleInit();
    return service;
  }

  describe('sendMail', () => {
    it('dispatches via Gmail API and returns ids', async () => {
      const service = await createService();
      const result = await service.sendMail({
        to: { email: 'u@example.com', name: 'User' },
        subject: 'Hello',
        htmlBody: '<p>Hi</p>',
      });
      expect(result.messageId).toBe('msg-1');
      expect(result.threadId).toBe('thread-1');
      expect(getGmailSendMock()).toHaveBeenCalled();
    });
    it('throws BadRequestException when recipient email is empty', async () => {
      const service = await createService();
      await expect(
        service.sendMail({
          to: { email: '   ' },
          subject: 'S',
          htmlBody: '<p>x</p>',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(getGmailSendMock()).not.toHaveBeenCalled();
    });
    it('throws BadRequestException when subject is empty', async () => {
      const service = await createService();
      await expect(
        service.sendMail({
          to: { email: 'a@b.com' },
          subject: '  ',
          htmlBody: '<p>x</p>',
        }),
      ).rejects.toThrow(BadRequestException);
    });
    it('throws BadRequestException when htmlBody is empty', async () => {
      const service = await createService();
      await expect(
        service.sendMail({
          to: { email: 'a@b.com' },
          subject: 'S',
          htmlBody: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });
    it('throws InternalServerErrorException when Gmail send fails', async () => {
      getGmailSendMock().mockRejectedValueOnce(new Error('api'));
      const service = await createService();
      await expect(
        service.sendMail({
          to: { email: 'a@b.com' },
          subject: 'S',
          htmlBody: '<p>x</p>',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('sendTemplateMail', () => {
    it('renders template then sends mail', async () => {
      const service = await createService();
      await service.sendTemplateMail({
        template: 'welcome',
        context: { name: 'Bob' },
        to: { email: 'bob@example.com' },
        subject: 'Welcome',
      });
      expect(mailTemplatesServiceMock.renderTemplate).toHaveBeenCalledWith(
        'welcome',
        { name: 'Bob' },
      );
      expect(getGmailSendMock()).toHaveBeenCalled();
    });
  });

  describe('onModuleInit', () => {
    it('throws when OAuth JSON file is missing', async () => {
      (existsSync as jest.Mock).mockReturnValue(false);
      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
          MailSettersService,
          { provide: ConfigService, useValue: configServiceMock },
          {
            provide: MailTemplatesService,
            useValue: mailTemplatesServiceMock,
          },
        ],
      }).compile();
      const service = moduleRef.get(MailSettersService);
      expect(() => service.onModuleInit()).toThrow(InternalServerErrorException);
    });
  });
});
