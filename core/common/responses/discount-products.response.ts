export const discountProductsResponses = {
  create: {
    noPermission: {
      code: 3011100,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    error: {
      code: 3011100,
      status: false,
      message:
        'The discount product could not be created, an error has occurred.',
    },
    success: {
      code: 3011100,
      status: true,
      message: 'The discount product has been successfully created.',
    },
  },
  list: {
    noPermission: {
      code: 3011200,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    notFound: {
      code: 3011200,
      status: false,
      message: 'The discount product(s) could not be found.',
    },
    error: {
      code: 3011200,
      status: false,
      message:
        'The discount product(s) could not be listed, an error has occurred.',
    },
    success: {
      code: 3011200,
      status: true,
      message: 'The discount product(s) has been successfully listed.',
    },
  },
  delete: {
    noPermission: {
      code: 3011300,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    error: {
      code: 3011300,
      status: false,
      message:
        'The discount product(s) could not be deleted, an error has occurred.',
    },
    success: {
      code: 3011300,
      status: true,
      message: 'The discount product(s) has been successfully deleted.',
    },
  },
};
