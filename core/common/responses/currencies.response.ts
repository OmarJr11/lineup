export const currenciesResponses = {
    create: {
        noPermission: {
            code: 1900200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1900199,
            status: false,
            message: 'The Currency could not be created, an error has occurred.',
        },
        success: {
            code: 1910100,
            status: true,
            message: 'The Currency has been successfully created.',
        },
    },
    update: {
        noPermission: {
            code: 1900200,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1900299,
            status: false,
            message: 'The Currency could not be updated, an error has occurred.',
        },
        success: {
            code: 1910200,
            status: true,
            message: 'The Currency has been successfully updated.',
        },
    },
    list: {
        noPermission: {
            code: 1900300,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        notFound: {
            code: 1900398,
            status: false,
            message: 'The Currency(s) could not be found.',
        },
        error: {
            code: 1900399,
            status: false,
            message: 'The Currency(s) could not be listed, an error has occurred.',
        },
        success: {
            code: 1910300,
            status: true,
            message: 'The Currency(s) has been successfully listed.',
        },
    },
    delete: {
        noPermission: {
            code: 1900600,
            status: false,
            message: 'You do not have the necessary permissions to perform this action.',
        },
        error: {
            code: 1900699,
            status: false,
            message: 'The Currency could not be deleted, an error has occurred.',
        },
        success: {
            code: 1910600,
            status: true,
            message: 'The Currency has been successfully deleted.',
        },
    },
};
