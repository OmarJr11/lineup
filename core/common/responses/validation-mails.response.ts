export const validationMailsResponses = {
  create: {
    error: {
      code: 2200001,
      status: false,
      message: 'Failed to create the email validation record.',
    },
    success: {
      code: 2210001,
      status: true,
      message: 'Verification code has been sent successfully.',
    },
  },
  verify: {
    notFound: {
      code: 2200100,
      status: false,
      message: 'Verification code not found.',
    },
    expired: {
      code: 2200101,
      status: false,
      message: 'Verification code has expired.',
    },
    alreadyUsed: {
      code: 2200102,
      status: false,
      message: 'Verification code has already been used.',
    },
    invalid: {
      code: 2200103,
      status: false,
      message: 'Verification code is invalid.',
    },
    success: {
      code: 2210100,
      status: true,
      message: 'Email has been successfully verified.',
    },
  },
};
