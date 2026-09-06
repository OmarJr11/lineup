export const cartItemsResponses = {
  create: {
    noPermission: {
      code: 3700100,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    error: {
      code: 3700199,
      status: false,
      message: 'The Cart Item could not be created, an error has occurred.',
    },
    success: {
      code: 3710100,
      status: true,
      message: 'The Cart Item has been successfully created.',
    },
  },
  update: {
    noPermission: {
      code: 3700200,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    error: {
      code: 3700299,
      status: false,
      message: 'The Cart Item could not be updated, an error has occurred.',
    },
    success: {
      code: 3710200,
      status: true,
      message: 'The Cart Item has been successfully updated.',
    },
  },
  list: {
    noPermission: {
      code: 3700300,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    notFound: {
      code: 3700398,
      status: false,
      message: 'The Cart Item(s) could not be found.',
    },
    error: {
      code: 3700399,
      status: false,
      message: 'The Cart Item(s) could not be listed, an error has occurred.',
    },
    success: {
      code: 3710300,
      status: true,
      message: 'The Cart Item(s) has been successfully listed.',
    },
  },
  delete: {
    noPermission: {
      code: 3700400,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    error: {
      code: 3700499,
      status: false,
      message: 'The Cart Item could not be deleted, an error has occurred.',
    },
    success: {
      code: 3710400,
      status: true,
      message: 'The Cart Item has been successfully deleted.',
    },
  },
};
