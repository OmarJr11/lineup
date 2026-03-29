export const businessHoursResponses = {
  create: {
    noPermission: {
      code: 3400100,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    invalidRange: {
      code: 3400101,
      status: false,
      message: 'opensAtMinute must be lower than closesAtMinute.',
    },
    duplicatedSlotOrder: {
      code: 3400102,
      status: false,
      message: 'Duplicated slotOrder for the same day in request.',
    },
    error: {
      code: 3400199,
      status: false,
      message: 'The Business Hour could not be created, an error has occurred.',
    },
    success: {
      code: 3410100,
      status: true,
      message: 'The Business Hour has been successfully created.',
    },
  },
  update: {
    noPermission: {
      code: 3400200,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    invalidRange: {
      code: 3400201,
      status: false,
      message: 'opensAtMinute must be lower than closesAtMinute.',
    },
    error: {
      code: 3400299,
      status: false,
      message: 'The Business Hour could not be updated, an error has occurred.',
    },
    success: {
      code: 3410200,
      status: true,
      message: 'The Business Hour has been successfully updated.',
    },
  },
  list: {
    noPermission: {
      code: 3400300,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    notFound: {
      code: 3400398,
      status: false,
      message: 'The Business Hour(s) could not be found.',
    },
    error: {
      code: 3400399,
      status: false,
      message:
        'The Business Hour(s) could not be listed, an error has occurred.',
    },
    success: {
      code: 3410300,
      status: true,
      message: 'The Business Hour(s) has been successfully listed.',
    },
  },
  delete: {
    noPermission: {
      code: 3400400,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    error: {
      code: 3400499,
      status: false,
      message: 'The Business Hour could not be deleted, an error has occurred.',
    },
    success: {
      code: 3410400,
      status: true,
      message: 'The Business Hour has been successfully deleted.',
    },
  },
};
