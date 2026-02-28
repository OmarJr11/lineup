import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailSettersService } from './mail-setters.service';
import { MailTemplatesService } from './mail-templates.service';

/**
 * Module for Gmail API email integration with Handlebars template support.
 *
 * Credentials are loaded from two sources:
 * - `lo-oauth.json` (project root) → `client_id`, `client_secret`
 * - Environment variables → `GMAIL_REFRESH_TOKEN`, `GMAIL_SENDER_EMAIL`
 *
 * Templates must be placed in `core/modules/mail/templates/` with a `.hbs` extension.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
  ],
  providers: [MailTemplatesService, MailSettersService],
  exports: [MailSettersService],
})
export class MailModule {}
