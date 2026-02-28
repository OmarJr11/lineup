export const verificationCodesResponses = {
  create: {
    error: {
      code: 2400001,
      status: false,
      message: 'Failed to create the verification code record.',
    },
    success: {
      code: 2410001,
      status: true,
      message: 'Verification code has been sent successfully.',
    },
  },
  verify: {
    notFound: {
      code: 2400100,
      status: false,
      message: 'Verification code not found.',
    },
    expired: {
      code: 2400101,
      status: false,
      message: 'Verification code has expired.',
    },
    alreadyUsed: {
      code: 2400102,
      status: false,
      message: 'Verification code has already been used.',
    },
    invalid: {
      code: 2400103,
      status: false,
      message: 'Verification code is invalid.',
    },
    success: {
      code: 2410100,
      status: true,
      message: 'Verification code has been successfully verified.',
    },
  },
};
