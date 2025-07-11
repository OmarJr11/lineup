export const filesResponses = {
    upload: {
        noPermission: {
            code: 700100,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
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
    list: {
        noPermission: {
            code: 700300,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
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
