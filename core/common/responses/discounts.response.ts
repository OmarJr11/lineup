export const discountsResponses = {
  create: {
    noPermission: {
      code: 2900100,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    cantAssignDiscount: {
      code: 2900101,
      status: false,
      message: 'Business can only create discounts for itself',
    },
    error: {
      code: 2900199,
      status: false,
      message: 'The discount could not be created, an error has occurred.',
    },
    success: {
      code: 2910100,
      status: true,
      message: 'The discount has been successfully created.',
    },
  },
  update: {
    noPermission: {
      code: 2900200,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    error: {
      code: 2900299,
      status: false,
      message: 'The discount could not be updated, an error has occurred.',
    },
    success: {
      code: 2910200,
      status: true,
      message: 'The discount has been successfully updated.',
    },
  },
  list: {
    noPermission: {
      code: 2900300,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    notFound: {
      code: 2900301,
      status: false,
      message: 'The discount(s) could not be found.',
    },
    error: {
      code: 2900399,
      status: false,
      message: 'The discount(s) could not be listed, an error has occurred.',
    },
    success: {
      code: 2910300,
      status: true,
      message: 'The discount(s) has been successfully listed.',
    },
  },
  delete: {
    noPermission: {
      code: 2900400,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    error: {
      code: 2900499,
      status: false,
      message: 'The discount could not be deleted, an error has occurred.',
    },
    success: {
      code: 2910400,
      status: true,
      message: 'The discount has been successfully deleted.',
    },
  },
};
