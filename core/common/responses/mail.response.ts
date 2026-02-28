export const mailResponses = {
  config: {
    credentialsFileNotFound: {
      code: 2100001,
      status: false,
      message: 'Google OAuth credentials file (lo-oauth.json) not found.',
    },
    clientIdNotSet: {
      code: 2100002,
      status: false,
      message: 'client_id is missing in the Google OAuth credentials file.',
    },
    clientSecretNotSet: {
      code: 2100003,
      status: false,
      message: 'client_secret is missing in the Google OAuth credentials file.',
    },
    refreshTokenNotSet: {
      code: 2100004,
      status: false,
      message: 'GMAIL_REFRESH_TOKEN is not set in environment variables.',
    },
    senderEmailNotSet: {
      code: 2100005,
      status: false,
      message: 'GMAIL_SENDER_EMAIL is not set in environment variables.',
    },
  },
  sendMail: {
    invalidRecipient: {
      code: 2100100,
      status: false,
      message: 'At least one valid recipient email address is required.',
    },
    invalidSubject: {
      code: 2100101,
      status: false,
      message: 'Email subject must be a non-empty string.',
    },
    invalidBody: {
      code: 2100102,
      status: false,
      message: 'Email body must be a non-empty string.',
    },
    error: {
      code: 2100199,
      status: false,
      message: 'Failed to send email via Gmail API.',
    },
    success: {
      code: 2110100,
      status: true,
      message: 'Email has been successfully sent.',
    },
  },
  renderTemplate: {
    templateNotFound: {
      code: 2100200,
      status: false,
      message: 'The specified email template file was not found.',
    },
    renderError: {
      code: 2100299,
      status: false,
      message: 'Failed to render the email template.',
    },
  },
};
