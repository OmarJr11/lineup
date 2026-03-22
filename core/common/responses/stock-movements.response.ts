export const stockMovementsResponses = {
  create: {
    noPermission: {
      code: 2800100,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    error: {
      code: 2800199,
      status: false,
      message:
        'The stock movement could not be created, an error has occurred.',
    },
    success: {
      code: 2810100,
      status: true,
      message: 'The stock movement has been successfully created.',
    },
  },
  list: {
    noPermission: {
      code: 2800200,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    notFound: {
      code: 2800201,
      status: false,
      message: 'The stock movement(s) could not be found.',
    },
    error: {
      code: 2800299,
      status: false,
      message:
        'The stock movement(s) could not be listed, an error has occurred.',
    },
    success: {
      code: 2810200,
      status: true,
      message: 'The stock movement(s) has been successfully listed.',
    },
  },
};
