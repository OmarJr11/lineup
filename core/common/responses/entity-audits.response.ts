export const entityAuditsResponses = {
  create: {
    noPermission: {
      code: 3112100,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    error: {
      code: 3112100,
      status: false,
      message: 'The audit record could not be created, an error has occurred.',
    },
    success: {
      code: 3112100,
      status: true,
      message: 'The audit record has been successfully created.',
    },
  },
  list: {
    noPermission: {
      code: 3112200,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    notFound: {
      code: 3112200,
      status: false,
      message: 'The audit record(s) could not be found.',
    },
    error: {
      code: 3112200,
      status: false,
      message:
        'The audit record(s) could not be listed, an error has occurred.',
    },
    success: {
      code: 3112200,
      status: true,
      message: 'The audit record(s) has been successfully listed.',
    },
  },
};
