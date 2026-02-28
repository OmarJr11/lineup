import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { LogError } from '../../common/helpers/logger.helper';
import { mailResponses } from '../../common/responses';
import {
  IMailRecipient,
  ISendMailInput,
  ISendTemplateMailInput,
  ISendMailOutput,
} from './interfaces';
import { MailTemplatesService } from './mail-templates.service';

/** Gmail API scope required for sending emails */
const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send' as const;

/** Path to the Google OAuth credentials JSON file */
const OAUTH_CREDENTIALS_PATH = join(process.cwd(), 'lo-oauth.json');

/** Shape of the `web` block inside the Google OAuth credentials file */
interface IGoogleOAuthCredentials {
  readonly client_id: string;
  readonly client_secret: string;
}

/**
 * Service responsible for sending emails via the Gmail API using OAuth2.
 * Reads `client_id` and `client_secret` from `lo-oauth.json` at the project root.
 * Reads `GMAIL_REFRESH_TOKEN` and `GMAIL_SENDER_EMAIL` from environment variables.
 */
@Injectable()
export class MailSettersService implements OnModuleInit {
  private readonly logger = new Logger(MailSettersService.name);
  private readonly rConfig = mailResponses.config;
  private readonly rSendMail = mailResponses.sendMail;

  private oauth2Client: OAuth2Client;
  private senderEmail: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly mailTemplatesService: MailTemplatesService,
  ) {}

  /**
   * Initializes the OAuth2 client by combining credentials from the JSON file
   * and the refresh token from environment variables.
   * Called automatically by NestJS when the module is ready.
   */
  onModuleInit(): void {
    const { client_id, client_secret } = this.loadJsonCredentials();
    const refreshToken = this.configService.get<string>('GMAIL_REFRESH_TOKEN');
    const senderEmail = this.configService.get<string>('GMAIL_SENDER_EMAIL');

    this.validateEnvCredentials({ refreshToken, senderEmail });

    this.senderEmail = senderEmail;
    this.oauth2Client = new google.auth.OAuth2(client_id, client_secret);
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
      scope: GMAIL_SEND_SCOPE,
    });
  }

  /**
   * Sends an email with a raw HTML body via the Gmail API.
   *
   * @param {ISendMailInput} input - Email parameters including recipients, subject, and HTML body
   * @returns {Promise<ISendMailOutput>} The Gmail message ID and thread ID of the sent message
   * @throws {BadRequestException} When required fields are missing or invalid
   * @throws {InternalServerErrorException} When the Gmail API call fails
   */
  async sendMail(input: ISendMailInput): Promise<ISendMailOutput> {
    this.validateSendMailInput(input);
    const rawMessage = this.buildRawMessage(input);
    return this.dispatchMessage(rawMessage);
  }

  /**
   * Renders a Handlebars template and sends the result as an HTML email.
   *
   * @param {ISendTemplateMailInput} input - Email parameters including template name and context
   * @returns {Promise<ISendMailOutput>} The Gmail message ID and thread ID of the sent message
   * @throws {NotFoundException} When the specified template file does not exist
   * @throws {BadRequestException} When required fields are missing or invalid
   * @throws {InternalServerErrorException} When rendering or sending fails
   */
  async sendTemplateMail(input: ISendTemplateMailInput): Promise<ISendMailOutput> {
    const htmlBody = this.mailTemplatesService.renderTemplate(input.template, input.context);
    return this.sendMail({ ...input, htmlBody });
  }

  /**
   * Loads and parses the `lo-oauth.json` credentials file from the project root.
   *
   * @returns {IGoogleOAuthCredentials} Parsed client_id and client_secret
   * @throws {InternalServerErrorException} When the file is missing or credentials are incomplete
   */
  private loadJsonCredentials(): IGoogleOAuthCredentials {
    if (!existsSync(OAUTH_CREDENTIALS_PATH)) {
      LogError(this.logger, this.rConfig.credentialsFileNotFound.message, this.onModuleInit.name);
      throw new InternalServerErrorException(this.rConfig.credentialsFileNotFound);
    }
    const raw = readFileSync(OAUTH_CREDENTIALS_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as { web: IGoogleOAuthCredentials };
    const { client_id, client_secret } = parsed.web ?? {};
    if (!client_id) {
      LogError(this.logger, this.rConfig.clientIdNotSet.message, this.onModuleInit.name);
      throw new InternalServerErrorException(this.rConfig.clientIdNotSet);
    }
    if (!client_secret) {
      LogError(this.logger, this.rConfig.clientSecretNotSet.message, this.onModuleInit.name);
      throw new InternalServerErrorException(this.rConfig.clientSecretNotSet);
    }
    return { client_id, client_secret };
  }

  /**
   * Validates that the environment-provided credentials are present.
   *
   * @param config - Object with refreshToken and senderEmail
   * @throws {InternalServerErrorException} When any value is missing
   */
  private validateEnvCredentials(config: { refreshToken: string; senderEmail: string }): void {
    if (!config.refreshToken) {
      LogError(this.logger, this.rConfig.refreshTokenNotSet.message, this.onModuleInit.name);
      throw new InternalServerErrorException(this.rConfig.refreshTokenNotSet);
    }
    if (!config.senderEmail) {
      LogError(this.logger, this.rConfig.senderEmailNotSet.message, this.onModuleInit.name);
      throw new InternalServerErrorException(this.rConfig.senderEmailNotSet);
    }
  }

  /**
   * Validates the required fields of a send-mail input.
   *
   * @param {ISendMailInput} input - The email input to validate
   * @throws {BadRequestException} When any required field is invalid
   */
  private validateSendMailInput(input: ISendMailInput): void {
    const recipients = Array.isArray(input.to) ? input.to : [input.to];
    const hasValidRecipient = recipients.every(r => r?.email?.trim().length > 0);
    if (!hasValidRecipient) {
      LogError(this.logger, this.rSendMail.invalidRecipient.message, this.sendMail.name);
      throw new BadRequestException(this.rSendMail.invalidRecipient);
    }
    if (!input.subject?.trim()) {
      LogError(this.logger, this.rSendMail.invalidSubject.message, this.sendMail.name);
      throw new BadRequestException(this.rSendMail.invalidSubject);
    }
    if (!input.htmlBody?.trim()) {
      LogError(this.logger, this.rSendMail.invalidBody.message, this.sendMail.name);
      throw new BadRequestException(this.rSendMail.invalidBody);
    }
  }

  /**
   * Sends a pre-encoded raw MIME message through the Gmail API.
   *
   * @param {string} rawMessage - Base64url-encoded RFC 2822 MIME string
   * @returns {Promise<ISendMailOutput>} Gmail message ID and thread ID
   * @throws {InternalServerErrorException} When the Gmail API call fails
   */
  private async dispatchMessage(rawMessage: string): Promise<ISendMailOutput> {
    try {
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: rawMessage },
      });
      return {
        messageId: response.data.id,
        threadId: response.data.threadId,
      };
    } catch (error) {
      LogError(this.logger, error, this.sendMail.name);
      throw new InternalServerErrorException(this.rSendMail.error);
    }
  }

  /**
   * Builds a Base64url-encoded RFC 2822 MIME message from the input.
   *
   * @param {ISendMailInput} input - Email parameters
   * @returns {string} Base64url-encoded raw MIME string ready for the Gmail API
   */
  private buildRawMessage(input: ISendMailInput): string {
    const { to, subject, htmlBody, textBody, cc, bcc, replyTo } = input;
    const lines: string[] = [
      `From: ${this.senderEmail}`,
      `To: ${this.formatRecipients(to)}`,
    ];
    if (cc) lines.push(`Cc: ${this.formatRecipients(cc)}`);
    if (bcc) lines.push(`Bcc: ${this.formatRecipients(bcc)}`);
    if (replyTo) lines.push(`Reply-To: ${replyTo}`);
    lines.push(`Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`);
    lines.push('MIME-Version: 1.0');
    if (textBody) {
      const boundary = `boundary_${Date.now()}`;
      lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
      lines.push('');
      lines.push(`--${boundary}`);
      lines.push('Content-Type: text/plain; charset=UTF-8');
      lines.push('');
      lines.push(textBody);
      lines.push(`--${boundary}`);
      lines.push('Content-Type: text/html; charset=UTF-8');
      lines.push('');
      lines.push(htmlBody);
      lines.push(`--${boundary}--`);
    } else {
      lines.push('Content-Type: text/html; charset=UTF-8');
      lines.push('');
      lines.push(htmlBody);
    }
    return Buffer.from(lines.join('\r\n')).toString('base64url');
  }

  /**
   * Formats one or more recipients into a comma-separated RFC 2822 address string.
   *
   * @param {IMailRecipient | IMailRecipient[]} recipients - Recipient(s) to format
   * @returns {string} Formatted address string (e.g. `"John Doe <john@example.com>"`)
   */
  private formatRecipients(recipients: IMailRecipient | IMailRecipient[]): string {
    const list = Array.isArray(recipients) ? recipients : [recipients];
    return list
      .map(r => (r.name ? `${r.name} <${r.email}>` : r.email))
      .join(', ');
  }
}
