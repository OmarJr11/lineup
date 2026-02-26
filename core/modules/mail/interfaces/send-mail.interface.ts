/**
 * Represents a single email recipient with an optional display name
 */
export interface IMailRecipient {
  /** Recipient email address */
  readonly email: string;
  /** Optional display name for the recipient */
  readonly name?: string;
}

/**
 * Input parameters for sending an email with a raw HTML body
 */
export interface ISendMailInput {
  /** Primary recipient(s) of the email */
  readonly to: IMailRecipient | IMailRecipient[];
  /** Email subject line */
  readonly subject: string;
  /** HTML body content of the email */
  readonly htmlBody: string;
  /** Optional plain-text fallback body */
  readonly textBody?: string;
  /** Optional CC recipient(s) */
  readonly cc?: IMailRecipient | IMailRecipient[];
  /** Optional BCC recipient(s) */
  readonly bcc?: IMailRecipient | IMailRecipient[];
  /** Optional Reply-To address */
  readonly replyTo?: string;
}

/**
 * Input parameters for sending an email rendered from a Handlebars template.
 * The template file must exist at `core/modules/mail/templates/{template}.hbs`.
 */
export interface ISendTemplateMailInput {
  /** Primary recipient(s) of the email */
  readonly to: IMailRecipient | IMailRecipient[];
  /** Email subject line */
  readonly subject: string;
  /**
   * Template filename without extension.
   * Example: 'welcome' resolves to `templates/welcome.hbs`
   */
  readonly template: string;
  /** Data object injected into the Handlebars template as context variables */
  readonly context: Record<string, unknown>;
  /** Optional plain-text fallback body */
  readonly textBody?: string;
  /** Optional CC recipient(s) */
  readonly cc?: IMailRecipient | IMailRecipient[];
  /** Optional BCC recipient(s) */
  readonly bcc?: IMailRecipient | IMailRecipient[];
  /** Optional Reply-To address */
  readonly replyTo?: string;
}

/**
 * Output returned after a successful email send operation
 */
export interface ISendMailOutput {
  /** Gmail message ID assigned to the sent message */
  readonly messageId: string;
  /** Thread ID the message belongs to */
  readonly threadId: string;
}
