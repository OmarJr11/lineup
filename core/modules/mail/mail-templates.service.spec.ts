import { NotFoundException } from '@nestjs/common';
import { MailTemplatesService } from './mail-templates.service';

/**
 * Unit tests for {@link MailTemplatesService}.
 */
describe('MailTemplatesService', () => {
  let service: MailTemplatesService;

  beforeEach(() => {
    service = new MailTemplatesService();
  });

  describe('renderTemplate', () => {
    it('renders welcome template with context', () => {
      const html = service.renderTemplate('welcome', {
        name: 'Alice',
        actionUrl: 'https://example.com',
        actionLabel: 'Go',
      });
      expect(html).toContain('Alice');
      expect(html).toContain('https://example.com');
    });
    it('throws NotFoundException when template file is missing', () => {
      expect(() =>
        service.renderTemplate('nonexistent-template-xyz-123', {}),
      ).toThrow(NotFoundException);
    });
  });
});
