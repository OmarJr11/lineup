export const notificationResponses = {
  create: {
    noPermission: {
      code: 3500100,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    error: {
      code: 3500199,
      status: false,
      message: 'The notification could not be created, an error has occurred.',
    },
    success: {
      code: 3510100,
      status: true,
      message: 'The notification has been successfully created.',
    },
  },
  list: {
    noPermission: {
      code: 3500200,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    notFound: {
      code: 3500201,
      status: false,
      message: 'The notification(s) could not be found.',
    },
    error: {
      code: 3500299,
      status: false,
      message:
        'The notification(s) could not be listed, an error has occurred.',
    },
    success: {
      code: 3510100,
      status: true,
      message: 'The notification(s) has been successfully listed.',
    },
  },
  markRead: {
    noPermission: {
      code: 3500300,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    notFound: {
      code: 3500301,
      status: false,
      message: 'The notification could not be found.',
    },
    error: {
      code: 3500399,
      status: false,
      message:
        'The notification could not be updated as read, an error has occurred.',
    },
    success: {
      code: 3510300,
      status: true,
      message: 'The notification has been marked as read.',
    },
  },
  ephemeral: {
    noPermission: {
      code: 3500400,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    validationError: {
      code: 3500401,
      status: false,
      message: 'Invalid ephemeral notification payload.',
    },
    error: {
      code: 3500499,
      status: false,
      message:
        'The ephemeral notification could not be sent, an error has occurred.',
    },
    success: {
      code: 3510400,
      status: true,
      message: 'The ephemeral notification has been successfully sent.',
    },
  },
};
