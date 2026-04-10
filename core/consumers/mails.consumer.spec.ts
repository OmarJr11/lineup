import { Job } from 'bullmq';
import { MailsConsumer } from './mails.consumer';
import { MailSettersService } from '../modules/mail/mail-setters.service';
import { MailsConsumerEnum } from '../common/enums/consumers';

/**
 * Unit tests for {@link MailsConsumer}.
 */
describe('MailsConsumer', () => {
  let consumer: MailsConsumer;
  const mailSettersServiceMock = {
    sendMail: jest.fn(),
    sendTemplateMail: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consumer = new MailsConsumer(
      mailSettersServiceMock as unknown as MailSettersService,
    );
  });

  it('delegates SendMail to MailSettersService', async () => {
    const payload = { to: 'a@b.com', subject: 's', html: '<p>x</p>' };
    const job = {
      name: MailsConsumerEnum.SendMail,
      data: payload,
    } as Job;
    await consumer.process(job);
    expect(mailSettersServiceMock.sendMail).toHaveBeenCalledWith(payload);
  });

  it('delegates SendTemplateMail to MailSettersService', async () => {
    const payload = {
      to: 'a@b.com',
      template: 'welcome',
      context: {},
    };
    const job = {
      name: MailsConsumerEnum.SendTemplateMail,
      data: payload,
    } as Job;
    await consumer.process(job);
    expect(mailSettersServiceMock.sendTemplateMail).toHaveBeenCalledWith(
      payload,
    );
  });
});
