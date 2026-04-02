export const filesResponses = {
  upload: {
    noPermission: {
      code: 700100,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    adultContent: {
      code: 700101,
      status: false,
      message: 'You can not upload the file, it has adult content.',
    },
    noAcceptableExtension: {
      code: 700102,
      status: false,
      message: 'You can not upload the file, file extension is not accepted.',
    },
    noAcceptableDirectory: {
      code: 700103,
      status: false,
      message: 'You can not upload the file, directory is not accepted.',
    },
    poorQuality: {
      code: 700104,
      status: false,
      message: 'The image cannot be uploaded, poor quality.',
    },
    importParseError: {
      code: 700105,
      status: false,
      message:
        'The document could not be parsed into products. Please validate document format and try again.',
    },
    importFileRequired: {
      code: 700106,
      status: false,
      message: 'File is required for product import.',
    },
    error: {
      code: 700199,
      status: false,
      message: 'The File(s) could not be uploaded, an error has occurred.',
    },
    success: {
      code: 710100,
      status: true,
      message: 'The File(s) has been successfully uploaded.',
    },
  },
  update: {
    noPermission: {
      code: 700200,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    invalidInput: {
      code: 700201,
      status: false,
      message: 'Invalid input.',
    },
    error: {
      code: 700299,
      status: false,
      message: 'The File(s) could not be updated, an error has occurred.',
    },
    success: {
      code: 710200,
      status: true,
      message: 'The File(s) has been successfully updated.',
    },
  },
  list: {
    noPermission: {
      code: 700300,
      status: false,
      message:
        'You do not have the necessary permissions to perform this action.',
    },
    notFound: {
      code: 700301,
      status: false,
      message: 'The File(s) was not found.',
    },
    error: {
      code: 700399,
      status: false,
      message: 'The File(s) could not be listed, an error has occurred.',
    },
    success: {
      code: 710300,
      status: true,
      message: 'The File(s) has been successfully listed.',
    },
  },
};
