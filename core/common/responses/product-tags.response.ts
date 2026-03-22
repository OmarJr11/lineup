export const productTagsResponses = {
  create: {
    noPermission: {
      code: 3300700,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    error: {
      code: 3300799,
      status: false,
      message: 'The product tags could not be saved, an error has occurred.',
    },
    success: {
      code: 3310700,
      status: true,
      message: 'The product tags have been successfully saved.',
    },
  },
  delete: {
    noPermission: {
      code: 3300800,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    error: {
      code: 3300899,
      status: false,
      message: 'The product tags could not be deleted, an error has occurred.',
    },
    success: {
      code: 3310800,
      status: true,
      message: 'The product tags have been successfully deleted.',
    },
  },
};
