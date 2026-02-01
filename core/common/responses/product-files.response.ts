/* eslint-disable max-len */
export const productFilesResponses = {
    create: {
        noPermission: {
            code: 1500200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1500199,
            status: false,
            message: 'The ProductFile could not be created, an error has occurred.',
        },
        success: {
            code: 1510100,
            status: true,
            message: 'The ProductFile has been successfully created.',
        },
    },
    update: {
        noPermission: {
            code: 1500200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1500299,
            status: false,
            message: 'The ProductFile could not be updated, an error has occurred.',
        },
        success: {
            code: 1510200,
            status: true,
            message: 'The ProductFile has been successfully updated.',
        },
    },
    list: {
        noPermission: {
            code: 1500300,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        notFound: {
            code: 1500398,
            status: false,
            message: 'The ProductFile(s) could not be found.',
        },
        error: {
            code: 1500399,
            status: false,
            message: 'The ProductFile(s) could not be listed, an error has occurred.',
        },
        success: {
            code: 1510300,
            status: true,
            message: 'The ProductFile(s) has been successfully listed.',
        },
    },
    delete: {
        noPermission: {
            code: 1500400,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1500499,
            status: false,
            message: 'The ProductFile could not be deleted, an error has occurred.',
        },
        success: {
            code: 1510400,
            status: true,
            message: 'The ProductFile has been successfully deleted.',
        },
    },
};
